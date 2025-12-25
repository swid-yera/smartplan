import type { AwardViolationEnum, IAward } from './awards.types'
import type { IRupModule } from './rup.types'

export interface IGroup {
	id: string
	name: string
	specialty: string
	qualification: string
}

export interface IUser {
	keycloak_id?: string

	username?: string
	name: string
	secondName: string
	roles: string[] // TODO:
	phone: string
	email: string

	rups?: IRupModule[]
	totalPoint?: number
	awards?: IAward[]
	violation?: AwardViolationEnum
}
