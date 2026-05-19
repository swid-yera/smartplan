export type CategoryFieldType = 'text' | 'textarea' | 'number' | 'select' | 'date' | 'file' | 'url'

export interface ICategoryFieldRequest {
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

export interface ICategoryRequest {
	name: string
	icon?: string
	description?: string
	awardTypes: string[]
	fields: ICategoryFieldRequest[]
}

export interface ICategoryTypeCriteriaResponse {
	id: string
	name: string
	points: number[]
	method: string
}

export interface ICategoryTypeVariantResponse {
	id: string
	name: string
	description: string
	criteria: ICategoryTypeCriteriaResponse[]
	bonusCriteria?: ICategoryTypeCriteriaResponse[]
	bonus_criteria?: ICategoryTypeCriteriaResponse[]
}

export interface ICategoryTypeResponse {
	id: string
	name: string
	variants: ICategoryTypeVariantResponse[]
}

export interface ICategoryFieldResponse {
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

export interface ICategoryListItemResponse {
	id: string
	name: string
	icon?: string
	description?: string
}

export interface ICategoryResponse {
	id: string
	name: string
	icon?: string
	description?: string
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
