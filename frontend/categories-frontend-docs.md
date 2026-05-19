# `/categories` frontend docs

Документ описывает реальный контракт backend для `pkg/handler/category_handler.go` и связанных сервисов.

## 1) Базовая информация

- Base URL: `/<endpoint>` (например, `https://api.example.com/categories`)
- Все `/categories` роуты защищены сессией (`sid` cookie).
- Для браузера нужен `credentials: 'include'` (или `withCredentials: true` в axios).
- `POST`/`PUT` отправляйте как `application/json`.
- Если передаёте `Accept`, он должен содержать `application/json` или `*/*`.

## 2) Эндпоинты

## `GET /categories`

Возвращает короткий список категорий (без полей и без awardTypes).

### Успех `200`

```json
[
  {
    "id": "2c4e60f2-8f9b-4f31-90c8-6b92a567e2c1",
    "name": "Публикации",
    "icon": "book",
    "description": "Категория для научных публикаций"
  }
]
```

### Ошибки

- `401` `{ "error": "no session" }` или `{ "error": "session expired or invalid" }`
- `500` `{ "error": "..." }`

---

## `GET /categories/:id`

Возвращает полную категорию.

### Успех `200`

```json
{
  "id": "2c4e60f2-8f9b-4f31-90c8-6b92a567e2c1",
  "name": "Публикации",
  "icon": "book",
  "description": "Категория для научных публикаций",
  "awardTypes": [
    "1ed6f2b7-bddc-46df-962e-0a8d8e75ce4d"
  ],
  "awardTypesExpanded": [
    {
      "id": "1ed6f2b7-bddc-46df-962e-0a8d8e75ce4d",
      "name": "Научная деятельность",
      "variants": []
    }
  ],
  "fieldsExpanded": [
    {
      "id": "ca8f71be-f07d-45fe-af33-326dcfd8c965",
      "key": "publicationUrl",
      "label": "Ссылка на публикацию",
      "type": "url",
      "required": true,
      "placeholder": "https://...",
      "helpText": "Укажите ссылку на источник",
      "options": [],
      "validation": {},
      "sortOrder": 1,
      "createdAt": "2026-05-19T08:00:00Z",
      "updatedAt": "2026-05-19T08:00:00Z"
    }
  ],
  "createdAt": "2026-05-19T08:00:00Z",
  "updatedAt": "2026-05-19T08:00:00Z"
}
```

### Ошибки

- `400` `{ "error": "invalid category ID" }`
- `404` `{ "error": "category not found" }`
- `500` `{ "error": "..." }`

---

## `POST /categories`

Создаёт категорию.

### Body

```json
{
  "name": "Публикации",
  "icon": "book",
  "description": "Категория для научных публикаций",
  "awardTypes": [
    "1ed6f2b7-bddc-46df-962e-0a8d8e75ce4d"
  ],
  "fields": [
    {
      "key": "publicationUrl",
      "label": "Ссылка на публикацию",
      "type": "url",
      "required": true,
      "placeholder": "https://...",
      "helpText": "Укажите ссылку на источник",
      "options": [],
      "validation": {},
      "sortOrder": 1
    }
  ]
}
```

### Успех `201`

Возвращает ту же структуру, что и `GET /categories/:id`.

### Ошибки

- `400` `{ "error": "invalid request body", "details": "..." }`
- `400` бизнес-валидация, например:
  - `{ "error": "name is required" }`
  - `{ "error": "invalid awardTypes uuid" }`
  - `{ "error": "award type not found" }`
  - `{ "error": "field key is required" }`
  - `{ "error": "field label is required" }`
  - `{ "error": "unsupported field type: ..." }`
  - `{ "error": "duplicate field key: ..." }`
- `500` `{ "error": "..." }`

---

## `PUT /categories/:id`

Полное обновление категории.

Важно: это не patch. Backend:
- обновляет саму категорию,
- удаляет все старые `fields`,
- создаёт поля заново из `fields` в запросе.

Следствие для фронта:
- всегда отправляйте полный актуальный массив `fields`.
- `id/createdAt/updatedAt` у полей после `PUT` могут измениться.

### Body

Тот же формат, что у `POST /categories`.

### Успех `200`

Возвращает полную категорию (как `GET /categories/:id`).

### Ошибки

- `400` `{ "error": "invalid category ID" }`
- `400` `{ "error": "invalid request body", "details": "..." }`
- `400` бизнес-валидация (те же ошибки, что и у POST)
- `404` `{ "error": "category not found" }`
- `500` `{ "error": "..." }`

---

## `DELETE /categories/:id`

Удаляет категорию.

### Успех `200`

```json
{ "message": "Category deleted successfully" }
```

### Ошибки

- `400` `{ "error": "invalid category ID" }`
- `404` `{ "error": "category not found" }`
- `409` `{ "error": "category is used by awards" }`
- `500` `{ "error": "..." }`

## 3) Правила валидации полей категории

Для каждого `fields[]`:
- `key`: обязателен, уникален в пределах категории (без учёта регистра).
- `label`: обязателен.
- `type`: один из:
  - `text`
  - `textarea`
  - `number`
  - `select`
  - `date`
  - `file`
  - `url`
  - `checkbox`

Прочее:
- `options`: если не передан/`null` -> backend вернёт `[]`.
- `validation`: если не передан/`null` -> backend вернёт `{}`.
- Поля в `fieldsExpanded` отсортированы по `sortOrder` ASC, затем `createdAt` ASC.

## 4) Готовые TypeScript-типы

```ts
export type CategoryFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'file'
  | 'url'
  | 'checkbox';

export interface CategoryFieldRequest {
  key: string;
  label: string;
  type: CategoryFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: unknown;
  validation?: Record<string, unknown>;
  sortOrder: number;
}

export interface CategoryRequest {
  name: string;
  icon?: string;
  description?: string;
  awardTypes: string[]; // UUID[]
  fields: CategoryFieldRequest[];
}

export interface TypeCriteriaResponse {
  id: string;
  name: string;
  points: number[];
  method: string;
}

export interface TypeVariantResponse {
  id: string;
  name: string;
  description: string;
  criteria: TypeCriteriaResponse[];
  bonus_criteria: TypeCriteriaResponse[];
}

export interface TypeResponse {
  id: string;
  name: string;
  variants: TypeVariantResponse[];
}

export interface CategoryFieldResponse {
  id: string;
  key: string;
  label: string;
  type: CategoryFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options: unknown;
  validation: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListItemResponse {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  awardTypes: string[];
  awardTypesExpanded?: TypeResponse[];
  fieldsExpanded: CategoryFieldResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
```

## 5) Рекомендуемый frontend service (пример)

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    let err: ApiError = { error: `HTTP ${res.status}` };
    try {
      err = (await res.json()) as ApiError;
    } catch {}
    throw Object.assign(new Error(err.error), { status: res.status, details: err.details });
  }

  return (await res.json()) as T;
}

export const categoriesApi = {
  getAll: () => api<CategoryListItemResponse[]>('/categories'),
  getById: (id: string) => api<CategoryResponse>(`/categories/${id}`),
  create: (payload: CategoryRequest) =>
    api<CategoryResponse>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: CategoryRequest) =>
    api<CategoryResponse>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    api<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};
```

## 6) Интеграционные заметки

- Для формы редактирования сначала делайте `GET /categories/:id`, затем на `Save` отправляйте полный `CategoryRequest`.
- На `DELETE` обрабатывайте `409` отдельно: показывайте, что категория используется в awards и не может быть удалена.
- Если `awardTypesExpanded` отсутствует в ответе, это нормально (обычно когда `awardTypes` пустой).
