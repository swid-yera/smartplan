import type { IMessageResponse } from './global.service.type'

// sync
export interface IGroupSyncResponse extends IMessageResponse {
	result: {
		added: number
		updated: number
		deleted: number
	}
	status: string
}
