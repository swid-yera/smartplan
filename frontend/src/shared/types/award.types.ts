import type { IUser } from './global.types'

export enum AwardStatusEnum {
	DRAFT = 'DRAFT',
	IN_REVIEW = 'IN_REVIEW',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

export enum AwardViolationEnum {
	NONE = 'NONE',
	REMARK = 'REMARK',
	REBUKE = 'REBUKE',
	SEVERE_REPRIMAND = 'SEVERE_REPRIMAND',
}

export enum IAwardTypeCriteriaMethodEnum {
	NORMAL = 'NORMAL',
	MEASURING = 'MEASURING',
	PENALTY = 'PENALTY',
}

export interface IAward {
	id: string

	title: string
	status: AwardStatusEnum
	teacher: IUser

	methodist?: IUser
	reason?: string

	totalPoints: number
	type: IAwardType
	variant: IAwardTypeVariant
	criteria: IAwardTypeCriteria

	text?: string
	images?: string[]
	document?: string
	links?: string[]

	createdAt: string
	updatedAt: string
}

export interface IAwardType {
	id: string
	name: string
	variants?: IAwardTypeVariant[]
}

export interface IAwardTypeVariant {
	id: string
	name: string
	description: string
	criteria?: IAwardTypeCriteria[]
	bonusCriteria?: IAwardTypeCriteria[]
}

export interface IAwardTypeCriteria {
	id: string
	name: string
	points: number[]
	method: IAwardTypeCriteriaMethodEnum
}
