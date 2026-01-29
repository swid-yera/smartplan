import type { IUser, StatusEnum } from './global.type'

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

	totalPoints: number
	text: string
	files?: string[]
	links?: string[]

	createdAt: string
	updatedAt: string
}

export interface IType {
	id: string
	name: string
	variants: IVariant[]
}

export interface IVariant {
	id: string
	name: string
	description: string
	criteria: ICriteria[]
	bonusCriteria: ICriteria[]
}

export interface ICriteria {
	id: string
	name: string
	points: number[]
	method: CriteriaMethodEnum
}
