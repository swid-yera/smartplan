import type { StatusEnum } from '../global.type'

export interface IMessageResponse {
	message: string
}

export interface IPaginationRequest {
	currentPage?: number
	pageSize?: number
	search?: string
	sort?: 'asc' | 'desc'
}

// update status
export interface IUpdateStatusRequest {
	id: string
	status: StatusEnum
	reason?: string
	variant?: string
	criteria?: string
	bonusCriteria?: string
	key_id?: string
	user_id?: string
	totalPoints?: number
	password?: string
	confirmed?: boolean
}
