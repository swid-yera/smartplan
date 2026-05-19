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
	"awardTypes": ["1ed6f2b7-bddc-46df-962e-0a8d8e75ce4d"],
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
	"awardTypes": ["1ed6f2b7-bddc-46df-962e-0a8d8e75ce4d"],
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

Прочее:

- `options`: если не передан/`null` -> backend вернёт `[]`.
- `validation`: если не передан/`null` -> backend вернёт `{}`.
- Поля в `fieldsExpanded` отсортированы по `sortOrder` ASC, затем `createdAt` ASC.

## 4) Готовые TypeScript-типы

```ts
export type CategoryFieldType = 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'url'

export interface CategoryFieldRequest {
	key: string
	label: string
	type: CategoryFieldType
	required: boolean
	placeholder?: string
	helpText?: string
	options?: unknown
	validation?: Record<string, unknown>
	sortOrder: number
}

export interface CategoryRequest {
	name: string
	icon?: string
	description?: string
	awardTypes: string[] // UUID[]
	fields: CategoryFieldRequest[]
}

export interface TypeCriteriaResponse {
	id: string
	name: string
	points: number[]
	method: string
}

export interface TypeVariantResponse {
	id: string
	name: string
	description: string
	criteria: TypeCriteriaResponse[]
	bonus_criteria: TypeCriteriaResponse[]
}

export interface TypeResponse {
	id: string
	name: string
	variants: TypeVariantResponse[]
}

export interface CategoryFieldResponse {
	id: string
	key: string
	label: string
	type: CategoryFieldType
	required: boolean
	placeholder?: string
	helpText?: string
	options: unknown
	validation: Record<string, unknown>
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export interface CategoryListItemResponse {
	id: string
	name: string
	icon?: string
	description?: string
}

export interface CategoryResponse {
	id: string
	name: string
	icon?: string
	description?: string
	awardTypes: string[]
	awardTypesExpanded?: TypeResponse[]
	fieldsExpanded: CategoryFieldResponse[]
	createdAt: string
	updatedAt: string
}

export interface ApiError {
	error: string
	details?: string
}
```

## 5) Рекомендуемый frontend service (пример)

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL

async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: 'include',
		headers: {
			Accept: 'application/json',
			...(init?.body ? { 'Content-Type': 'application/json' } : {}),
			...(init?.headers ?? {}),
		},
		...init,
	})

	if (!res.ok) {
		let err: ApiError = { error: `HTTP ${res.status}` }
		try {
			err = (await res.json()) as ApiError
		} catch {}
		throw Object.assign(new Error(err.error), { status: res.status, details: err.details })
	}

	return (await res.json()) as T
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
}
```

## 6) Интеграционные заметки

- Для формы редактирования сначала делайте `GET /categories/:id`, затем на `Save` отправляйте полный `CategoryRequest`.
- На `DELETE` обрабатывайте `409` отдельно: показывайте, что категория используется в awards и не может быть удалена.
- Если `awardTypesExpanded` отсутствует в ответе, это нормально (обычно когда `awardTypes` пустой).

## 7) Поле `select`: полная инструкция для frontend

Ниже описано, как именно работать с category-field типа `select` в текущем проекте.

### 7.1 Что backend ожидает от `select`-поля в категории

В `fields[]` объект поля должен иметь:

- `type: "select"`
- `options`: набор вариантов выбора

Пример поля категории:

```json
{
	"key": "publicationLevel",
	"label": "Уровень публикации",
	"type": "select",
	"required": true,
	"placeholder": "Выберите уровень",
	"helpText": "Выберите один из доступных уровней",
	"options": ["Республиканский", "Международный"],
	"validation": {},
	"sortOrder": 1
}
```

Важно:

- backend не валидирует структуру `options` строго (поле хранится как JSON).
- frontend обязан сам привести `options` к безопасному виду для UI.

### 7.2 Какие форматы `options` поддерживает frontend сейчас

В `CategoryFieldInput` используется `parseSelectOptions(options)`, и он принимает:

- `string` элемент: `"A"` -> `{ label: "A", value: "A" }`
- `number` элемент: `10` -> `{ label: "10", value: "10" }`
- объект:
   - берёт `value`, если есть
   - берёт `label`, если есть
   - если `label` нет, использует `value`
   - если `value` нет, пытается взять `name`

Формально корректные примеры:

```json
["A", "B", "C"]
```

```json
[1, 2, 3]
```

```json
[
	{ "label": "Q1", "value": "q1" },
	{ "name": "Q2", "value": "q2" }
]
```

Рекомендация для стабильности:

- используйте единый формат `[{ "label": "...", "value": "..." }]`.
- `value` делайте стабильным slug/кодом (например `international`), а `label` человекочитаемым текстом.

### 7.3 Как рендерить `select` в форме достижения

Логика рендера уже есть в `frontend/src/components/fields/category-field-input.tsx`:

- для поля типа `select` строится массив `options` через `parseSelectOptions`.
- если массив пустой, контрол `Select` не рисуется (fallback уйдёт в обычный `Input` ниже по коду).
- выбранное значение хранится как `string`.

Текущее поведение:

- `value` в контроле: `typeof value === 'string' ? value : ''`
- выбор пользователя: `onValueChange(nextValue) => onChange(field.key, nextValue)`

### 7.4 Как хранить значение в state

Для category fields значение `select` должно храниться строкой:

- пустое значение: `''`
- выбранное значение: `'some_option_value'`

Это уже совпадает с текущей моделью:

- `ICategoryFieldValue = string | File[]`
- для `select` используется именно `string`.

### 7.5 Валидация `select` на фронте перед отправкой

Рекомендуемый минимум:

- если поле `required`, запрещать `''`.
- если есть `options`, проверять, что выбранное значение входит в список допустимых `value`.

Быстрая схема проверки:

1. Нормализовать `field.options` в `{label,value}[]`.
2. Построить `Set` из `value`.
3. Если значение непустое и не входит в `Set`, показать ошибку.

Это защищает от случаев, когда `options` поменялись, а в форме осталось старое значение.

### 7.6 Что отправлять в API

В `fieldValues` отправляйте строку или массив строк (backend это допускает для `select`):

```json
{
	"fieldValues": {
		"publicationLevel": "international"
	}
}
```

Для текущего single-select UI используйте строку.
Массив строк нужен только если отдельно реализуете multi-select интерфейс.

### 7.7 Edge cases, которые нужно обработать

- `options` пустой/`null`: показать disabled/select fallback и не давать отправку required-поля.
- дубликаты `value` в `options`: на этапе нормализации оставлять только уникальные `value`.
- значение пришло из API, но отсутствует в актуальных `options`: показывать ошибку "значение устарело, выберите заново".
- `label` меняется, `value` нет: это нормально, сохранённые данные не ломаются.

### 7.8 Рекомендуемый формат `select` в категории (best practice)

Используйте только такой вид:

```json
{
	"type": "select",
	"options": [
		{ "label": "Республиканский", "value": "republic" },
		{ "label": "Международный", "value": "international" }
	]
}
```

Это самый предсказуемый вариант для:

- рендера в UI,
- валидации,
- обратной совместимости при смене текста `label`.
