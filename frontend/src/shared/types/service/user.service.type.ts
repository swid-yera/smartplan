import type { IUser } from '../global.type'
import type { IViolationRecord } from '../violation.type'

export interface ICreatePenaltyRequest {
	points: number
	note: string
}

export interface IUpsertViolationRequest {
	note: string
}

export interface IViolationActionResponse {
	violation: IViolationRecord
	user: IUser
}
