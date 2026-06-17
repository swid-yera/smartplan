import type { StatusEnum } from '../global.type'

export interface IMessageResponse {
	message: string
}

export interface IPaginationRequest {
	currentPage?: number
	pageSize?: number
	search?: string
	sort?: 'asc' | 'desc'
	departmentId?: string
}

export interface IKriptoEncryptedPrivateKey {
	type?: string
	version?: number
	cipher: string
	kdf: string
	hash: string
	iterations: number
	salt: string
	nonce: string
	value: string
	encoding?: string
}

export interface IKriptoKeyPayload {
	format: string
	version: number
	purpose?: string
	keyId: string
	userId: string
	algorithm: string
	deviceName?: string
	createdAt?: string
	publicKey: string
	encryptedPrivateKey: IKriptoEncryptedPrivateKey
	comment?: unknown
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
	signature?: string
	kripto?: IKriptoKeyPayload
}

export interface IKpiUploadExceptionUser {
	keycloakId: string
	username: string
	email: string
	firstName: string
	lastName: string
}

export interface IKpiUploadBlockDateResponse {
	blockedAfterDate: string | null
	exceptionUserIds: string[]
	exceptionUsers?: IKpiUploadExceptionUser[]
	canBypassUploadLock: boolean
}

export interface IUpdateKpiUploadBlockDateRequest {
	blockedAfterDate: string | null
	exceptionUserIds: string[]
}
