export interface IMessageResponse {
	message: string
}

export interface IPaginationRequest {
	currentPage?: number
	pageSize?: number
	search?: string
}
