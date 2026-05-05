import type { StatusEnum } from '../global.type'

export interface IMessageResponse {
	message: string
}

export interface IPaginationRequest {
	currentPage?: number
	pageSize?: number
	search?: string
}

// update status
export interface IUpdateStatusRequest {
	id: string
	status: StatusEnum
	reason?: string
	key_id?: string
	user_id?: string
	public_key?: string
	challenge?: string
	signature?: string
	totalPoints?: number
}
