import type { IAward, ViolationEnum } from './award.types'
import type { IRup } from './rup.types'

export enum StatusEnum {
	DRAFT = 'DRAFT',
	IN_REVIEW = 'IN_REVIEW',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

export enum UserRoleEnum {
	TEACHER = 'TEACHER',
	METHODIST = 'METHODIST',
	ADMIN = 'ADMIN',
}

export interface IGroup {
	keycloakId: string
	name: string
	specialty?: string
	qualification?: string
}

export interface IPagination<T> {
	data: T[]
	meta: {
		currentPage: number
		pages: number
		total: number
		pageSize: number
	}
}

export interface IUser {
	keycloakId: string

	username: string
	email?: string
	role: UserRoleEnum

	firstName: string
	lastName: string
	phone: string

	rups?: IRup[]
	totalPoint?: number
	awards?: IAward[]
	violation?: ViolationEnum

	createdAt: string
	updatedAt: string
}
