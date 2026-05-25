import type { CriteriaMethodEnum } from '../award.type'
import type { LocaleText, LocalizedText } from '../locale.type'

// create award
export interface ICreateAwardRequest {
	links?: string | string[]
	text?: string

	type: string
	variant: string
	criteria: string
	bonusCriteria?: string
	categoryId?: string
	fieldValues?: Record<string, string | string[] | number>
}

export type IUpdateAwardRequest = ICreateAwardRequest

// create types
export interface ICreateTypesRequest {
	name: LocaleText
	variants: IVariantRequest[]
}

export interface IVariantRequest {
	name: LocaleText
	description: LocaleText | null
	criteria: ICriteriaRequest[]
	bonusCriteria: ICriteriaRequest[]
}

export interface ICriteriaRequest {
	name: LocaleText
	points: number[]
	method: CriteriaMethodEnum
}

// variant response
export interface ITypeResponse {
	id: string
	name: LocalizedText
	variants: IVariantResponse[]
}

export interface IVariantResponse {
	id: string
	name: LocalizedText
	description: LocalizedText
	criteria: ICriteriaResponse[]
	bonusCriteria?: ICriteriaResponse[]
}

export interface ICriteriaResponse {
	id: string
	name: LocalizedText
	points: number[]
	method: CriteriaMethodEnum
}

export interface IDepartmentRatingResponse {
	keycloakId: string
	name: LocalizedText
	totalPoints: number
	userCount: number
}
