import type { CriteriaMethodEnum } from '../award.types'

// create award
export interface ICreateAwardRequest {
	text: string
	links?: string

	type: string
	variant: string
	criteria: string
	bonusCriteria?: string
}

// create types
export interface ICreateTypesRequest {
	name: string
	variants: IVariantRequest[]
}

export interface IVariantRequest {
	name: string
	description: string
	criteria: ICriteriaRequest[]
	bonusCriteria: ICriteriaRequest[]
}

export interface ICriteriaRequest {
	name: string
	points: number[]
	method: CriteriaMethodEnum
}

// variant response
export interface ITypeResponse {
	id: string
	name: string
	variants: IVariantResponse[]
}

export interface IVariantResponse {
	id: string
	name: string
	description: string
	criteria: ICriteriaResponse[]
	bonusCriteria?: ICriteriaResponse[]
}

export interface ICriteriaResponse {
	id: string
	name: string
	points: number[]
	method: CriteriaMethodEnum
}
