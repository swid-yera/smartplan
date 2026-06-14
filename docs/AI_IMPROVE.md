# AI improvement plan: NLLB-200 translation service

Цель: убрать перевод текста из LLM-пайплайна и перевести все `ru <-> kz` преобразования на отдельный self-hosted translation-service на базе NLLB-200.

Что это меняет:
- `/ai/rups/*` не трогаем как пользовательский API.
- Генерация метаданных, дисциплин, тем и уроков остается на текущем AI-провайдере.
- Только перевод `ru <-> kz` уходит в локальный сервис перевода.
- Это резко снижает число запросов к внешнему AI и убирает расход токенов на перевод.

## Почему именно NLLB-200

NLLB-200 - это multilingual translation model family от Meta, покрывающая 200+ языков. Для нашего кейса важен не “чат-ответ”, а стабильный машинный перевод.

Плюсы для проекта:
- перевод работает локально, без токенов внешнего LLM;
- подходит для backend-сервиса;
- можно хостить внутри инфраструктуры;
- можно кешировать ответы по хэшу текста;
- можно делать batch-translation, а не переводить каждую строку отдельно;
- удобно обернуть в Docker и подключить через HTTP.

Почему это лучше текущего AI-перевода:
- сейчас перевод запускается по полям и по элементам массивов;
- каждый кусок уходит отдельным запросом;
- при повторной генерации часто переводится одно и то же;
- fallback по AI-моделям дополнительно умножает запросы.

## Целевое решение

Нужно ввести отдельный сервис:

`translation-service`

Он должен:
- принимать массивы строк и одиночные строки;
- переводить `ru -> kz` и `kz -> ru`;
- поддерживать batch API;
- кешировать повторные переводы;
- работать локально в Docker;
- не зависеть от OpenAI/Gemini;
- быть внутренним сервисом для backend.

### Рекомендуемый стек

Лучший практический вариант:
- NLLB-200 модель;
- CTranslate2 как inference engine;
- Python + FastAPI как тонкий HTTP слой;
- Redis для кеша;
- Docker / Docker Compose для деплоя.

Почему такой стек:
- CTranslate2 дает быстрый inference на CPU/GPU;
- Python удобен для обвязки и post-processing;
- FastAPI быстро поднимается как отдельный internal API;
- Redis хорошо подходит для кеша по хэшу текста.

## Архитектура

### До изменений

- frontend вызывает backend;
- backend для части переводов вызывает AI;
- backend переводит поля по одному;
- количество запросов растет линейно от числа текстовых узлов;
- токены тратятся даже на обычные переводы.

### После изменений

- frontend остается без изменений;
- backend вызывает `translation-service` только для `ru <-> kz`;
- перевод идет батчами;
- одинаковые строки кешируются;
- LLM остается только для генерации контента, не для перевода;
- `/ai/rups/*` продолжает жить как генерация, но перевод оттуда уходит.

## Что именно менять в backend

### 1. Вынести перевод в отдельный интерфейс

Сейчас перевод сидит в:
- `backend/pkg/service/rup_service.go`
- `backend/pkg/service/lesson_service.go`
- `backend/pkg/service/ai_service.go` / `backend/pkg/service/openai_service.go`

Нужно сделать отдельный слой:

`backend/pkg/service/translation_service.go`

Интерфейс примерно такой:

```go
type TranslationService interface {
    TranslateText(ctx context.Context, req TranslateTextRequest) (string, error)
    TranslateBatch(ctx context.Context, req TranslateBatchRequest) ([]string, error)
}
```

### 2. Перевод РУПа перевести на batch-режим

Сейчас `generateLanguageForRup()` в `backend/pkg/service/rup_service.go` переводит:
- название;
- exploration note;
- ресурсы;
- дисциплины;
- темы;
- и делает это поэлементно.

Нужно заменить на pipeline:

1. Собрать все `LocaleText`-значения в один массив.
2. Посчитать hash каждого текста.
3. Пройти Redis cache.
4. Отправить на `translation-service` только уникальные промахи.
5. Разложить результат обратно по дереву RUP.

Это должно сократить число запросов с `O(fields)` до `O(sections)` или лучше.

### 3. Перевод уроков тоже перевести на batch

В `backend/pkg/service/lesson_service.go` сейчас перевод идет по:
- goals;
- tasks;
- expected;
- progress content lines;
- resource names.

Нужно сделать batch-обработку:
- собирать все строки перед переводом;
- переводить пачкой;
- кешировать повторяющиеся строки;
- на выходе восстанавливать структуру.

### 4. Убрать AI-перевод из `TranslateText`

`TranslateText()` в AI-сервисе больше не должен отвечать за перевод `ru <-> kz`.

Вместо этого:
- либо делегировать в `TranslationService`;
- либо оставить AI-сервис только для генерации текста;
- либо удалить `TranslateText` из AI-интерфейса, если он больше нигде не нужен.

Рекомендация: оставить AI только для генерации, а перевод вынести в отдельный сервис.

### 5. Ограничить fallback

Сейчас fallback по моделям может размножать количество запросов.

Для translation-service fallback не нужен в таком виде:
- либо переводим локально;
- либо отдаем ошибку;
- либо используем быстрый retry на сетевые ошибки.

Для NLLB-сервиса лучше:
- 1 основной модельный путь;
- 1 retry при transient error;
- без цепочки “модель за моделью”.

## Batch API для translation-service

Нужен не только `POST /translate`, но и batch-метод.

### Вариант API

```http
POST /translate
Content-Type: application/json

{
  "source": "ru",
  "target": "kz",
  "text": "..."
}
```

Ответ:

```json
{
  "text": "..."
}
```

### Batch API

```http
POST /translate/batch
Content-Type: application/json

{
  "source": "ru",
  "target": "kz",
  "texts": [
    "Первый текст",
    "Второй текст",
    "Первый текст"
  ]
}
```

Ответ:

```json
{
  "texts": [
    "Первый перевод",
    "Второй перевод",
    "Первый перевод"
  ]
}
```

Что важно:
- сохранять порядок;
- поддерживать дубликаты;
- переводить только уникальные строки внутри одного batch;
- отдавать ответы по индексу исходного массива.

## Кеширование

Для этого проекта кеш обязателен.

### Ключ кеша

Рекомендуемый ключ:

`translation:{source}:{target}:{model}:{hash(text)}`

Где hash можно считать от:
- нормализованного текста;
- source language;
- target language;
- model version;
- domain, если он нужен.

### Где кешировать

Лучше два уровня:

1. In-memory cache на время одного job.
2. Redis cache для повторных запусков и регенераций.

### TTL

Для RUP и lesson translation:
- 7-30 дней обычно достаточно;
- если текст часто повторяется, можно держать дольше;
- для стабильных шаблонных строк это особенно выгодно.

## Docker

### Отдельный сервис

Сервис должен жить отдельно от backend:

- `backend`
- `translation-service`
- `redis`

### Dockerfile для translation-service

Примерная схема:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8082

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8082"]
```

### requirements.txt

Минимальный набор:

```txt
fastapi
uvicorn[standard]
redis
ctranslate2
sentencepiece
transformers
```

Если модель конвертируется отдельно, `transformers` может понадобиться только на этапе conversion/build.

### docker-compose пример

```yaml
services:
  backend:
    build: ./backend
    environment:
      TRANSLATION_BASE_URL: http://translation-service:8082
      TRANSLATION_CACHE_REDIS: redis:6379
    depends_on:
      - translation-service
      - redis

  translation-service:
    build: ./translation-service
    environment:
      REDIS_URL: redis://redis:6379/0
      NLLB_MODEL_PATH: /models/nllb-200-distilled-600M-ct2-int8
      SOURCE_LANG_DEFAULT: ru
      TARGET_LANG_DEFAULT: kz
    volumes:
      - ./models:/models
    ports:
      - "8082:8082"
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Где хранить модель

Модель лучше не скачивать на каждый старт контейнера.

Рекомендуется:
- либо prebuild model image;
- либо volume `/models`;
- либо отдельный init job, который скачивает и конвертирует модель один раз.

## Как собрать NLLB-200 под CTranslate2

Пайплайн такой:

1. Берем исходную модель NLLB-200 или fine-tuned `ru <-> kz` weights.
2. Конвертируем в формат CTranslate2.
3. Поднимаем inference server поверх CTranslate2.
4. Делаем HTTP API для backend.

Если качество base NLLB-200 на `ru <-> kz` окажется недостаточным, следующий шаг:
- fine-tune NLLB-200 на параллельном `ru-kz` корпусе;
- потом снова конвертировать в CTranslate2.

## Практическая интеграция в backend

### Новый internal client

Добавить клиент:

`backend/pkg/service/translation_client.go`

Функции:
- `TranslateText(ctx, ...)`
- `TranslateBatch(ctx, ...)`
- `TranslateIfNeeded(ctx, ...)`

### Изменить места вызова

Заменить AI-перевод в:
- `backend/pkg/service/rup_service.go`
- `backend/pkg/service/lesson_service.go`

на вызов translation client.

### Оставить AI только там, где он нужен

AI оставить для:
- генерации метаданных РУПа;
- генерации ресурсов;
- генерации дисциплин;
- генерации тем;
- генерации уроков.

Перевод - только через NLLB-сервис.

## План внедрения

### Этап 1. Выделить сервис перевода

- создать `translation-service`;
- поднять его в Docker;
- проверить `ru -> kz` и `kz -> ru` на нескольких RUP-текстах;
- убедиться, что ответы стабильные.

### Этап 2. Подключить backend

- добавить client;
- переключить `translateLocaleText()` и lesson translation helpers;
- добавить Redis cache;
- добавить batch API.

### Этап 3. Упростить AI слой

- убрать AI-перевод из общего AI service;
- оставить AI только для генерации;
- сократить fallback-цепочки.

### Этап 4. Замерить эффект

Смотреть:
- число translation requests на один RUP;
- число translation requests на один lesson;
- cache hit rate;
- latency;
- memory usage сервиса.

## Риски

### 1. Качество перевода на base NLLB-200

Если качество `ru <-> kz` будет средним, нужен fine-tune на доменных данных РУП.

### 2. Модельный размер и память

NLLB может быть тяжелым.

Нужно заранее решить:
- CPU-only или GPU;
- какой размер модели использовать;
- нужен ли distilled/quantized вариант;
- допустима ли latency в несколько сотен миллисекунд.

### 3. Доменные термины

Для РУП и уроков важно:
- сохранять аббревиатуры;
- сохранять названия дисциплин;
- не переводить именованные сущности;
- не ломать списки и структурированные поля.

Поэтому сервис должен поддерживать:
- protected terms;
- domain hints;
- no-translate spans для терминов;
- нормализацию пунктуации.

## Что я считаю лучшим для этого проекта

Рекомендую именно такой путь:

1. Поднять отдельный `translation-service` на NLLB-200.
2. Запускать его локально в Docker.
3. В backend заменить AI-перевод на этот сервис.
4. Добавить batch translation и Redis cache.
5. Оставить `/ai/rups/*` только для генерации, не для перевода.

Это лучше всего подходит, потому что:
- снижает расход токенов;
- уменьшает количество внешних запросов;
- хорошо встраивается в текущую архитектуру;
- не требует менять frontend;
- дает контролируемый, дешевый и предсказуемый перевод.

## Короткий итог

Для `ru <-> kz` в этом проекте лучше не использовать LLM-перевод.

Лучший вариант:
- NLLB-200 как локальный translation-service;
- Dockerized deployment;
- HTTP API для backend;
- batch translation;
- Redis cache;
- AI только для генерации, не для перевода.
