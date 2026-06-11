import type { CriteriaMethodEnum } from '../award.type'
import type { IAward } from '../award.type'
import type { LocaleText, LocalizedText } from '../locale.type'
import type { ICategoryMultiFieldRowValue, ICategoryResponse } from './categories.service.type'

// create award
export interface ICreateAwardRequest {
	links?: string | string[]
	text?: string

	type: string
	variant: string
	criteria: string
	bonusCriteria?: string
	categoryId?: string
	fieldValues?: Record<string, string | string[] | number | ICategoryMultiFieldRowValue[]>
}

export type IUpdateAwardRequest = ICreateAwardRequest

export interface IUpdateAwardPointsRequest {
	id: string
	totalPoints: number
}

// create types
export interface ICreateTypesRequest {
	name: LocaleText
	variants: IVariantRequest[]
}

export interface IVariantRequest {
	name: LocaleText
	description: LocaleText | null
	criteria: ICriteriaRequest[]
	bonus_criteria: ICriteriaRequest[]
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
	description: LocalizedText | null
	criteria: ICriteriaResponse[]
	bonus_criteria?: ICriteriaResponse[] | null
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

export interface IReviewTeacherSummaryResponse {
	keycloakId: string
	firstName: string
	lastName: string
	username: string
	totalPoints: number
	reviewAwardsCount: number
}

export interface IAwardUserKpiCategorySummaryResponse {
	categoryId: string
	category?: ICategoryResponse
	currentPoints: number
	pendingPoints: number
	awards: IAward[]
}

export interface IAwardUserKpiSummaryResponse {
	currentPoints: number
	categories: IAwardUserKpiCategorySummaryResponse[]
}

export type IAwardCategoryResponse = ICategoryResponse
