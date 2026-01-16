import type { AwardViolationEnum, IAward } from './award.types'
import type { IRup } from './rup.types'

export enum UserRoleEnum {
	TEACHER = 'TEACHER',
	METHODIST = 'METHODIST',
	ADMIN = 'ADMIN',
}

export interface IGroup {
	keycloak_id: string
	name: string
	specialty?: string
	qualification?: string
}

export interface IUser {
	keycloakID: string

	username: string
	email?: string
	role: UserRoleEnum

	firstName: string
	lastName: string
	phone: string

	rups?: IRup[]
	totalPoint?: number
	awards?: IAward[]
	violation?: AwardViolationEnum

	created_at: string
	updated_at: string
}
