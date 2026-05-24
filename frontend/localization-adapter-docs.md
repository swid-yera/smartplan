# Localization и dynamic fields для frontend service

## 1. LocaleText

Backend хранит мультиязычные поля в формате:

```ts
export type LocaleText = {
	ru: string
	kz: string
}
```

Такой формат используется в полях:

```txt
name
description
label
placeholder
helpText
criteria.name
variant.name
type.name
```

Пример:

```json
{
	"name": {
		"ru": "Публикации",
		"kz": "Жарияланымдар"
	}
}
```

Frontend не должен делать `name: string`.

Правильно:

```ts
name: LocaleText
```

---

## 2. Helper для вывода текста

```ts
export type Locale = 'ru' | 'kz'

export function getLocaleText(value?: LocaleText | null, locale: Locale = 'ru'): string {
	if (!value) return ''

	return value[locale]?.trim() || value.ru?.trim() || value.kz?.trim() || ''
}
```

Пример:

```tsx
<h3>{getLocaleText(type.name, currentLocale)}</h3>
```

---

## 3. Как backend принимает LocaleText

Frontend должен отправлять:

```json
{
	"ru": "Название на русском",
	"kz": "Қазақша атауы"
}
```

Backend сам убирает пробелы по краям строк.

Можно отправить `description: null`, если описание необязательное.

---

## 4. Award Type

```ts
export type AwardType = {
	id: string
	name: LocaleText
	variants: AwardVariant[]
}

export type AwardVariant = {
	id: string
	name: LocaleText
	description: LocaleText | null
	criteria: AwardCriteria[]
	bonus_criteria: AwardCriteria[]
}

export type AwardCriteria = {
	id: string
	name: LocaleText
	points: number[]
	method: string
}
```

Create/update payload:

```ts
export type CreateAwardTypeRequest = {
	name: LocaleText
	variants: {
		name: LocaleText
		description: LocaleText | null
		criteria: {
			name: LocaleText
			points: number[]
			method: string
		}[]
		bonus_criteria: {
			name: LocaleText
			points: number[]
			method: string
		}[]
	}[]
}
```

Пример body:

```json
{
	"name": {
		"ru": "Публикации",
		"kz": "Жарияланымдар"
	},
	"variants": [
		{
			"name": {
				"ru": "Статья",
				"kz": "Мақала"
			},
			"description": {
				"ru": "Публикация статьи",
				"kz": "Мақаланы жариялау"
			},
			"criteria": [
				{
					"name": {
						"ru": "Республиканский уровень",
						"kz": "Республикалық деңгей"
					},
					"points": [10, 20],
					"method": "SELECT"
				}
			],
			"bonus_criteria": []
		}
	]
}
```

---

## 5. Award Category

Категории нужны, чтобы frontend мог строить динамическую форму заявки.

```ts
export type AwardCategoryRequest = {
	name: LocaleText
	icon: string
	description: LocaleText
	awardTypes: string[]
	fields: AwardCategoryFieldRequest[]
}
```

```ts
export type AwardCategoryResponse = {
	id: string
	name: LocaleText
	icon?: string
	description?: LocaleText
	awardTypes: string[]
	awardTypesExpanded?: AwardType[]
	fieldsExpanded: AwardCategoryFieldResponse[]
	createdAt: string
	updatedAt: string
}
```

---

## 6. Dynamic fields

Разрешенные типы:

```ts
export type DynamicFieldType = 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'url'
```

Field request:

```ts
export type AwardCategoryFieldRequest = {
	key: string
	label: LocaleText
	type: DynamicFieldType
	required: boolean
	placeholder: LocaleText | null
	helpText: LocaleText | null
	options: unknown
	validation: Record<string, unknown>
	sortOrder: number
}
```

Field response:

```ts
export type AwardCategoryFieldResponse = AwardCategoryFieldRequest & {
	id: string
	createdAt: string
	updatedAt: string
}
```

Главное поле — `key`.

Именно через `key` потом заполняется `fieldValues`.

---

## 7. fieldValues

`fieldValues` — объект, где ключи совпадают с `field.key`.

Пример fields:

```json
[
	{
		"key": "articleTitle",
		"type": "text"
	},
	{
		"key": "articleUrl",
		"type": "url"
	}
]
```

Тогда frontend отправляет:

```json
{
	"categoryId": "category-uuid",
	"fieldValues": {
		"articleTitle": "Название статьи",
		"articleUrl": "https://example.com/article"
	}
}
```

Если отправляется `fieldValues`, то обязательно нужен `categoryId`.

Backend запрещает неизвестные ключи:

```json
{
	"fieldValues": {
		"unknownField": "value"
	}
}
```

Такой payload вернет ошибку.

---

## 8. Значения по типам полей

| Type       | Value                   |
| ---------- | ----------------------- |
| `text`     | `string`                |
| `textarea` | `string`                |
| `date`     | `string`                |
| `url`      | `string` или `string[]` |
| `number`   | `number`                |
| `select`   | `string` или `string[]` |
| `file`     | `string` или `string[]` |

Типы для frontend:

```ts
export type FieldValue = string | number | string[] | null

export type FieldValues = Record<string, FieldValue>
```

---

## 9. Создание award

```ts
export type CreateAwardRequest = {
	type: string
	variant: string
	criteria: string
	bonusCriteria?: string | null
	categoryId?: string | null
	fieldValues?: FieldValues
}
```

Пример:

```json
{
	"type": "type-uuid",
	"variant": "variant-uuid",
	"criteria": "criteria-uuid",
	"bonusCriteria": null,
	"categoryId": "category-uuid",
	"fieldValues": {
		"articleTitle": "Использование ИС в колледже",
		"articleUrl": "https://example.com/article",
		"publishDate": "2026-01-01"
	}
}
```

---

## 10. File fields

Если поле имеет `type: "file"`, файл отправляется через `multipart/form-data`.

Ключ файла:

```txt
fieldValues.<fieldKey>
```

Пример:

```ts
const formData = new FormData()

formData.append('type', payload.type)
formData.append('variant', payload.variant)
formData.append('criteria', payload.criteria)

if (payload.categoryId) {
	formData.append('categoryId', payload.categoryId)
}

formData.append('fieldValues', JSON.stringify(payload.fieldValues ?? {}))

files.forEach((file) => {
	formData.append('fieldValues.proofFile', file)
})

await api.post('/awards', formData)
```

Backend может вернуть file value как `string` или `string[]`.

---

## 11. Frontend service example

```ts
import { api } from '@/shared/api'

export async function getAwardTypes(): Promise<AwardType[]> {
	const response = await api.get<AwardType[]>('/award/types')
	return response.data
}

export async function createAwardType(payload: CreateAwardTypeRequest): Promise<AwardType> {
	const response = await api.post<AwardType>('/award/types', payload)
	return response.data
}

export async function getCategories(): Promise<AwardCategoryResponse[]> {
	const response = await api.get<AwardCategoryResponse[]>('/award/categories')
	return response.data
}

export async function getCategoryById(id: string): Promise<AwardCategoryResponse> {
	const response = await api.get<AwardCategoryResponse>(`/award/categories/${id}`)
	return response.data
}

export async function createAward(payload: CreateAwardRequest): Promise<AwardResponse> {
	const response = await api.post<AwardResponse>('/awards', payload)
	return response.data
}
```

---

## 12. Логика frontend

Frontend должен:

1. Получить категории.
2. Выбрать категорию.
3. Взять `fieldsExpanded`.
4. Отсортировать поля по `sortOrder`.
5. Построить форму по `field.type`.
6. Собрать `fieldValues`, где ключ = `field.key`.
7. Отправить `categoryId` и `fieldValues`.
8. Для файлов использовать `multipart/form-data`.

Коротко:

```ts
fieldValues[field.key] = userInputValue
```

Пример:

```ts
fieldValues['articleTitle'] = 'Название статьи'
fieldValues['articleUrl'] = 'https://example.com/article'
fieldValues['proofFile'] = file
```
