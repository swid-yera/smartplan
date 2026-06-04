# Настройка eduplan с OmniRoute

Этот документ описывает, как подключить eduplan к локальному OmniRoute вместо использования платных токенов Gemini.

## Что было сделано

1. **Создан новый AI сервис** (`backend/pkg/service/openai_service.go`) для работы с OpenAI-совместимыми API
2. **Обновлена конфигурация** (`backend/config/config.go`) для поддержки выбора провайдера
3. **Изменен main.go** для инициализации правильного AI сервиса на основе конфигурации
4. **Обновлен .env.example** с примерами настройки

## Быстрый старт

### 1. Убедитесь, что OmniRoute запущен

```powershell
# Проверьте, что OmniRoute работает
curl http://localhost:20128/v1/models
```

Если команда возвращает список моделей - всё в порядке. Если нет, запустите OmniRoute через ваш bat-файл:

```cmd
C:\bat\freeclaude.bat
```

### 2. Настройте переменные окружения

Создайте или обновите файл `backend/.env`:

**Если backend запущен локально (не в Docker):**
```bash
# Выберите OpenAI в качестве провайдера
AI_PROVIDER=openai

# Настройки OmniRoute
OPENAI_BASE_URL=http://localhost:20128/v1
OPENAI_API_KEY=sk-4dce7e87ca216d42-3a652a-12a62054
OPENAI_MODEL=kr/claude-sonnet-4.5

# Остальные настройки (KeK, DB, Redis, Minio) остаются без изменений
```

**Если backend запущен в Docker:**
```bash
# Выберите OpenAI в качестве провайдера
AI_PROVIDER=openai

# Настройки OmniRoute (используйте host.docker.internal вместо localhost)
OPENAI_BASE_URL=http://host.docker.internal:20128/v1
OPENAI_API_KEY=sk-4dce7e87ca216d42-3a652a-12a62054
OPENAI_MODEL=kr/claude-sonnet-4.5

# Остальные настройки (KeK, DB, Redis, Minio) остаются без изменений
```

### 3. Перезапустите backend

```bash
cd backend
go run main.go
```

При запуске вы должны увидеть в логах:

```
Using OpenAI-compatible API provider at http://localhost:20128/v1 with model kr/claude-sonnet-4.5
```

## Доступные модели в OmniRoute

### Платные (через Kiro AI токены)
- `kr/claude-opus-4.8` - самая мощная модель (1M контекст)
- `kr/claude-sonnet-4.6` - балансировка скорости и качества (200K контекст)
- `kr/claude-sonnet-4.5` - быстрая и качественная (200K контекст) **рекомендуется**
- `kr/claude-haiku-4.5` - самая быстрая (200K контекст)
- `kr/deepseek-3.2` - альтернатива для программирования
- `kr/minimax-m2.5` - хорошо для русского языка (200K контекст)
- `kr/glm-5` - китайская модель с thinking

### Бесплатные (через OpenCode)
- `oc/deepseek-v4-flash-free` - бесплатный DeepSeek (1M контекст)
- `oc/minimax-m2.5-free` - бесплатный MiniMax (204K контекст)
- `oc/big-pickle` - универсальная бесплатная модель
- `oc/trinity-large-preview-free` - ещё один бесплатный вариант

### Через DuckDuckGo
- `ddgw/gpt-4o-mini` - ChatGPT 4o mini (128K контекст)
- `ddgw/gpt-5-mini` - новая модель GPT (400K контекст)
- `ddgw/claude-3-5-haiku-20241022` - Claude Haiku (200K контекст)
- `ddgw/o3-mini` - reasoning модель (400K контекст)

## Выбор модели

Для генерации образовательного контента рекомендуется:

1. **Лучший выбор**: `kr/claude-sonnet-4.5` - отличное качество для русского и казахского языка
2. **Бесплатная альтернатива**: `oc/minimax-m2.5-free` - хорошо работает с русским языком
3. **Для экспериментов**: `oc/deepseek-v4-flash-free` - огромный контекст, быстро

## Переключение обратно на Gemini

Если нужно вернуться на Gemini, просто измените `AI_PROVIDER`:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
```

## Решение проблем

### OmniRoute не отвечает
```powershell
# Проверьте, запущен ли процесс
Get-Process | Select-String "omniroute"

# Проверьте порт
netstat -ano | Select-String "20128"
```

### Ошибка "connection refused"
- Убедитесь, что OmniRoute запущен
- Проверьте правильность URL: `http://localhost:20128/v1`
- Проверьте, не блокирует ли firewall порт 20128

### Ошибка аутентификации
- Проверьте правильность API ключа в `.env`
- API ключ должен совпадать с тем, что в `C:/bat/freeclaude.bat` (строка 16)

### Низкое качество генерации
- Попробуйте более мощную модель: `kr/claude-opus-4.8`
- Проверьте, что OmniRoute имеет доступ к интернету для использования API
- Убедитесь, что у вас достаточно токенов в Kiro AI

## Примечания

- OmniRoute должен быть запущен **до** запуска eduplan backend
- При использовании бесплатных моделей (`oc/*`, `ddgw/*`) могут быть rate limits
- Платные модели (`kr/*`) используют ваши токены из Kiro AI
- Локальный OmniRoute работает как прокси и не хранит токены - они берутся из вашего аккаунта
