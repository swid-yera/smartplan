import type { AwardViolationEnum, IAward } from './award.types'
import type { IRup } from './rup.types'

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

export interface IUser {
	keycloakId: string

	userName: string
	email?: string
	role: UserRoleEnum

	firstName: string
	lastName: string
	phone: string

	rups?: IRup[]
	totalPoint?: number
	awards?: IAward[]
	violation?: AwardViolationEnum

	createdAt: string
	updatedAt: string
}
