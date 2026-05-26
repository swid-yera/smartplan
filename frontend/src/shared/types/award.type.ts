import type { IUser, StatusEnum } from './global.type'
import type { LocalizedText } from './locale.type'
import type { IAwardCategoryResponse } from './service/award.service.type'

export enum ViolationEnum {
	NONE = 'NONE',
	REMARK = 'REMARK',
	REBUKE = 'REBUKE',
	SEVERE_REPRIMAND = 'SEVERE_REPRIMAND',
}

export enum CriteriaMethodEnum {
	NORMAL = 'NORMAL',
	MEASURING = 'MEASURING',
}

export interface IAward {
	id: string

	status: StatusEnum
	reason?: string

	teacher: IUser
	methodist?: IUser

	type: IType
	variant: IVariant
	criteria: ICriteria
	bonusCriteria?: ICriteria
	bonus_criteria?: ICriteria | null
	categoryId?: string
	category?: IAwardCategoryResponse | null
	fieldValues?: Record<string, string | string[]>

	totalPoints: number
	text: string
	files?: string[]
	links?: string[]

	createdAt: string
	updatedAt: string
}

export interface IType {
	id: string
	name: LocalizedText
	variants: IVariant[]
}

export interface IVariant {
	id: string
	name: LocalizedText
	description: LocalizedText | null
	criteria: ICriteria[]
	bonusCriteria?: ICriteria[]
	bonus_criteria?: ICriteria[] | null
}

export interface ICriteria {
	id: string
	name: LocalizedText
	points: number[]
	method: CriteriaMethodEnum
}
