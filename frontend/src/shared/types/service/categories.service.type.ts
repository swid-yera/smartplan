import type { LocaleText, LocalizedText } from '../locale.type'

export type CategoryFieldType = 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'url'

export interface ICategoryFieldRequest {
	key: string
	label: LocaleText
	type: CategoryFieldType
	required: boolean
	placeholder?: LocaleText | null
	helpText?: LocaleText | null
	options?: unknown
	validation?: Record<string, unknown>
	sortOrder: number
}

export interface ICategoryRequest {
	name: LocaleText
	icon?: string
	description?: LocaleText
	awardTypes: string[]
	fields: ICategoryFieldRequest[]
}

export interface ICategoryTypeCriteriaResponse {
	id: string
	name: LocalizedText
	points: number[]
	method: string
}

export interface ICategoryTypeVariantResponse {
	id: string
	name: LocalizedText
	description: LocalizedText
	criteria: ICategoryTypeCriteriaResponse[]
	bonusCriteria?: ICategoryTypeCriteriaResponse[]
	bonus_criteria?: ICategoryTypeCriteriaResponse[]
}

export interface ICategoryTypeResponse {
	id: string
	name: LocalizedText
	variants: ICategoryTypeVariantResponse[]
}

export interface ICategoryFieldResponse {
	id: string
	key: string
	label: LocalizedText
	type: CategoryFieldType
	required: boolean
	placeholder?: LocalizedText
	helpText?: LocalizedText
	options: unknown
	validation: Record<string, unknown>
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export interface ICategoryListItemResponse {
	id: string
	name: LocalizedText
	icon?: string
	description?: LocalizedText
}

export interface ICategoryResponse {
	id: string
	name: LocalizedText
	icon?: string
	description?: LocalizedText
	awardTypes: string[]
	awardTypesExpanded?: ICategoryTypeResponse[]
	fieldsExpanded: ICategoryFieldResponse[]
	createdAt: string
	updatedAt: string
}

export interface IApiErrorResponse {
	error: string
	details?: string
}
