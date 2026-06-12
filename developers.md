# Developers Guide for kripto

Эта заметка собрана по коду репозитория и покрывает именно интеграцию внешних сервисов с системой QR-кодов и публичной проверки подписи.

## Что делает система

`kripto` умеет:

1. Проверять, что публичный ключ принадлежит нужному пользователю и активен.
2. Проверять ED25519-подпись SHA-256 хэша документа.
3. Регистрировать внешнюю подпись от сервиса вроде Eduplan.
4. Возвращать публичную ссылку на страницу проверки и SVG-QR-код.
5. Отдавать публичную карточку подписи для страницы `verify-signature`.

QR-код здесь не хранит данные подписи. Он кодирует только публичный URL вида:

`{PUBLIC_VERIFICATION_BASE_URL}/verify-signature/{signature_id}`

## Основной поток

1. Администратор создаёт сервис-клиент в UI на странице подключений.
2. Backend выдаёт одноразовый bearer token.
3. Внешний сервис вызывает `POST /integration/signatures/register`.
4. Middleware проверяет сервисную авторизацию.
5. Сервис проверяет:
   - что ключ существует;
   - что ключ принадлежит `user_id`;
   - что ключ активен;
   - что подпись валидна криптографически;
   - что такой набор `document_id + document_version + public_key_id + document_hash` ещё не зарегистрирован.
6. Запись сохраняется в таблицу `external_signatures`.
7. Backend строит публичный URL, генерирует QR через `qrcode` crate и возвращает:
   - `signature_id`
   - `verification_url`
   - `qr_svg`
8. Публичная страница `/verify-signature/{signature_id}` читает данные через `GET /public/signatures/{signature_id}`.

## Где смотреть в коде

Если нужно быстро найти нужную часть, начинай отсюда:

- Маршруты HTTP: [`backend/src/http/routes.rs`](backend/src/http/routes.rs)
- Интеграционные handlers: [`backend/src/http/handlers/integration.rs`](backend/src/http/handlers/integration.rs)
- Публичные handlers: [`backend/src/http/handlers/public_signatures.rs`](backend/src/http/handlers/public_signatures.rs)
- Сервис регистрации внешних подписей: [`backend/src/services/external_signatures_service.rs`](backend/src/services/external_signatures_service.rs)
- Сервисная авторизация: [`backend/src/http/middleware/service_auth.rs`](backend/src/http/middleware/service_auth.rs)
- Конфиг публичного URL для QR: [`backend/src/config/public_verification.rs`](backend/src/config/public_verification.rs)
- DTO входа/выхода: [`backend/src/dto/register_external_signature.rs`](backend/src/dto/register_external_signature.rs), [`backend/src/dto/public_signature.rs`](backend/src/dto/public_signature.rs), [`backend/src/dto/integration_key.rs`](backend/src/dto/integration_key.rs)
- Репозитории БД: [`backend/src/repo/pg/external_signatures_repo.rs`](backend/src/repo/pg/external_signatures_repo.rs), [`backend/src/repo/pg/keys_repo.rs`](backend/src/repo/pg/keys_repo.rs), [`backend/src/repo/pg/service_clients_repo.rs`](backend/src/repo/pg/service_clients_repo.rs)
- Схема БД: [`backend/atlas/schema.sql`](backend/atlas/schema.sql)
- OpenAPI и интеграционная документация: [`backend/docs/openapi.yaml`](backend/docs/openapi.yaml), [`backend/docs/eduplan-integration.md`](backend/docs/eduplan-integration.md)
- Публичная страница фронтенда: [`ui/src/components/pages/verify-signature/VerifySignaturePage.tsx`](ui/src/components/pages/verify-signature/VerifySignaturePage.tsx), [`ui/src/pages/verify-signature/[id].tsx`](ui/src/pages/verify-signature/[id].tsx)
- Страница управления подключениями: [`ui/src/components/pages/integrations/Integrations.tsx`](ui/src/components/pages/integrations/Integrations.tsx)

## Как формируется QR

В коде QR создаётся не из самой подписи, а из публичной ссылки на страницу проверки.

Логика находится в [`backend/src/services/external_signatures_service.rs`](backend/src/services/external_signatures_service.rs):

- `signature_url(signature_id)` берётся из `PublicVerificationConfig`.
- Если `PUBLIC_VERIFICATION_BASE_URL` не задан, используются fallback-переменные:
  - `FRONTEND_URL`
  - `BASE_URL`
  - `http://localhost:3000`
- Затем QR рендерится как SVG:
  - размер: минимум `256x256`
  - dark color: `#000000`
  - light color: `#ffffff`

Важно:

- `qr_svg` генерируется на момент регистрации и возвращается сразу в ответе.
- В БД хранится `verification_url`, а не сам SVG.
- `GET /public/signatures/{signature_id}/qr.svg` умеет заново отдать SVG по сохранённому URL.

## Что хранится в БД

### `service_clients`

Таблица хранит сервисные подключения:

- `id`
- `name`
- `service_url`
- `client_id`
- `token_hash`
- `token_prefix`
- `allowed_audiences`
- `status`
- `created_by`
- `created_at`
- `updated_at`
- `disabled_at`
- `last_used_at`

Ключевой момент:

- полный bearer token не хранится;
- сохраняется только SHA-256 hash токена;
- при создании токен показывается один раз в UI;
- если токен потерян, его нужно перевыпустить через rotate.

### `external_signatures`

Таблица хранит зарегистрированные внешние подписи:

- `id`
- `user_id`
- `document_id`
- `document_version`
- `document_hash`
- `signature`
- `algorithm`
- `public_key_id`
- `signer_name`
- `signer_role`
- `verification_status`
- `verification_url`
- `source_service_client_id`
- `public_verification_enabled`
- `signed_at`
- `created_at`

Ключевой момент:

- `public_verification_enabled` сейчас при регистрации ставится в `true`;
- публичные endpoint'ы возвращают `404`, если проверка отключена;
- уникальность защищается индексом по:
  - `document_id`
  - `document_version`
  - `public_key_id`
  - `document_hash`

## Сервисная авторизация

Все внешние интеграционные endpoint'ы идут через `service_auth`.

### Режимы

1. DB-backed service client
   - `Authorization: Bearer <token>`
   - token ищется по SHA-256 hash в `service_clients`
   - после успешной проверки обновляется `last_used_at`

2. Static token
   - `VERIFY_STATIC_TOKENS`
   - подходит для простых приватных интеграций

3. JWT mode
   - только если `VERIFY_ALLOW_UNVERIFIED_JWT=true`
   - используется осторожно и только в доверенной сети

### Полезные заголовки

- `Authorization: Bearer <token>`
- `X-Service-Client`
- `X-Service-URL`
- `X-Service-Audience`
- `X-Correlation-ID`

### Важная деталь

В UI-документации чаще показываются только `X-Service-Client` и `X-Service-Audience`, но middleware ещё умеет валидировать `X-Service-URL` для DB-backed клиентов.

## Переменные окружения

### Для публичного QR

- `PUBLIC_VERIFICATION_BASE_URL`
- `FRONTEND_URL`
- `BASE_URL`

### Для service auth

- `VERIFY_AUTH_REQUIRED`
- `VERIFY_STATIC_TOKENS`
- `VERIFY_ALLOW_UNVERIFIED_JWT`
- `VERIFY_ALLOWED_CLIENTS`
- `VERIFY_ALLOWED_AUDIENCES`

### Общие

- `SERVER_HOST`
- `SERVER_PORT`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOW_CREDENTIALS`

## Форматы и ограничения

### Для регистрации внешней подписи

- `document_hash` должен быть `64` символа lowercase hex
- `signature` должен быть `128` символов lowercase hex
- `document_id` не может быть пустым
- `document_version`, если передан, не может быть пустым
- `key_id` и `user_id` должны быть UUID

### Для криптографии

- алгоритм: `ED25519`
- хэш документа: `SHA-256`
- длина `document_hash` в байтах: `32`
- длина подписи в байтах: `64`

### Для публичной страницы

`GET /public/signatures/{signature_id}` возвращает:

- `verification_status`
- `valid_at_signing_time`
- `public_key_fingerprint`
- `signer_name`
- `signer_role`
- `signed_at`

Страница на фронтенде находится здесь:

- [`ui/src/components/pages/verify-signature/VerifySignaturePage.tsx`](ui/src/components/pages/verify-signature/VerifySignaturePage.tsx)

Она обращается к:

- `GET /public/signatures/{id}`

и показывает:

- документ
- версию
- имя подписанта
- роль
- дату подписи
- алгоритм
- статус ключа
- результат проверки
- fingerprint ключа
- hash документа

## Как работает регистрация подписи

Логика регистрации находится в [`backend/src/services/external_signatures_service.rs`](backend/src/services/external_signatures_service.rs).

Порядок проверки:

1. Валидируется JSON-пейлоад.
2. Проверяются форматы hex-строк.
3. По `key_id` ищется публичный ключ.
4. Проверяется, что ключ принадлежит `user_id`.
5. Проверяется, что ключ активен.
6. Проверяется отсутствие дубля по `document_id + document_version + public_key_id + document_hash`.
7. Проверяется `ed25519` подпись.
8. Создаётся запись в `external_signatures`.
9. Генерируется public verification URL.
10. Генерируется SVG QR.
11. Возвращается ответ `201 Created`.

Если проверка подписи не проходит, API отдаёт `422 invalid_signature`.
Если ключ не найден, `404 not_found`.
Если ключ чужой или отозван, `409 conflict`.
Если такой документ уже зарегистрирован с тем же ключом и hash, тоже `409 conflict`.

## Публичная проверка

Публичные endpoint'ы:

- `GET /public/signatures/{signature_id}`
- `GET /public/signatures/{signature_id}/qr.svg`

Они используются публичной страницей и не требуют авторизации.

`GET /public/signatures/{signature_id}`:

- достаёт запись из `external_signatures`
- проверяет, включена ли публичная проверка
- загружает текущий `user_key`
- пересчитывает криптографическую валидность
- определяет статус:
  - `VALID`
  - `VALID_AT_SIGNING_KEY_REVOKED`
  - `KEY_REVOKED_BEFORE_SIGNING`
  - `INVALID`

`GET /public/signatures/{signature_id}/qr.svg`:

- берёт сохранённый `verification_url`
- заново рендерит QR как SVG

## Все curl-примеры из интеграции

### 1. Verify success

```bash
curl -X POST {{KRIPTO_BASE_URL}}/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{M2M_TOKEN}}" \
  -H "X-Correlation-ID: {{uuid}}" \
  -d '{
    "request_id":"{{uuid}}",
    "document_hash":"{{64hex}}",
    "signature":"{{128hex}}"
  }'
```

### 2. Verify by public key

```bash
curl -X POST {{KRIPTO_BASE_URL}}/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{M2M_TOKEN}}" \
  -d '{
    "public_key_id":"{{uuid}}",
    "document_hash":"{{64hex}}",
    "signature":"{{128hex}}"
  }'
```

### 3. Verify unauthorized

```bash
curl -X POST {{KRIPTO_BASE_URL}}/verify \
  -H "Content-Type: application/json" \
  -d '{
    "public_key_id":"{{uuid}}",
    "document_hash":"{{64hex}}",
    "signature":"{{128hex}}"
  }'
```

### 4. Get key metadata

```bash
curl -X GET {{KRIPTO_BASE_URL}}/integration/keys/{{key_id}} \
  -H "Authorization: Bearer {{M2M_TOKEN}}" \
  -H "X-Correlation-ID: {{uuid}}"
```

### 5. Validate key by user

```bash
curl -X POST {{KRIPTO_BASE_URL}}/integration/keys/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{M2M_TOKEN}}" \
  -H "X-Correlation-ID: {{uuid}}" \
  -d '{
    "key_id":"{{uuid}}",
    "user_id":"{{uuid}}"
  }'
```

### 6. Register signature and receive QR

```bash
curl -X POST {{KRIPTO_BASE_URL}}/integration/signatures/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{M2M_TOKEN}}" \
  -H "X-Service-Client: eduplan" \
  -H "X-Service-Audience: kripto" \
  -H "X-Correlation-ID: {{uuid}}" \
  -d '{
    "document_id":"rup-2026-001",
    "document_version":"v1",
    "document_hash":"{{64hex}}",
    "key_id":"{{uuid}}",
    "user_id":"{{uuid}}",
    "signature":"{{128hex}}",
    "signer_name":"Иванов Иван Иванович",
    "signer_role":"methodist"
  }'
```

### 7. Public signature verification

```bash
curl -X GET {{KRIPTO_BASE_URL}}/public/signatures/{{signature_id}}
```

### 8. Public QR SVG

```bash
curl -X GET {{KRIPTO_BASE_URL}}/public/signatures/{{signature_id}}/qr.svg
```

## Практические замечания

1. Если меняется домен фронтенда, проверь `PUBLIC_VERIFICATION_BASE_URL`.
2. Если внешний сервис не проходит auth, сначала проверь:
   - bearer token;
   - `X-Service-Client`;
   - `X-Service-URL`;
   - `X-Service-Audience`.
3. Если QR ведёт не туда, где ожидается, значит `verification_url` был сохранён с неправильным base URL.
4. Если публичная страница отдаёт `404`, это может означать:
   - запись не найдена;
   - публичная проверка отключена;
   - `public_verification_enabled = false`.
5. Если нужен новый QR для уже созданной подписи, используй `GET /public/signatures/{signature_id}/qr.svg`.
6. Если нужно поменять поведение на уровне БД, смотри миграции в `backend/atlas/migrations`.
