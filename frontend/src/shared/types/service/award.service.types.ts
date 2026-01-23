import type { CriteriaMethodEnum } from '../award.types'

// create award
export interface ICreateAwardRequest {
	text: string
	links?: string

	type: string
	variant: string
	criteria: string
	bonusCriteria?: string
}

// create types
export interface ICreateTypesRequest {
	name: string
	variants: IVariantRequest[]
}

export interface IVariantRequest {
	name: string
	description: string
	criteria: ICriteriaRequest[]
	bonusCriteria: ICriteriaRequest[]
}

export interface ICriteriaRequest {
	name: string
	points: number[]
	method: CriteriaMethodEnum
}

// variant response
export interface ITypeResponse {
	id: string
	name: string
	variants: IVariantResponse[]
}

interface IVariantResponse {
	id: string
	name: string
	description: string
	criteria: ICriteriaResponse[]
	bonusCriteria?: ICriteriaResponse[]
}

interface ICriteriaResponse {
	id: string
	name: string
	points: number[]
	method: CriteriaMethodEnum
}

// // update
// export interface IUpdateRupRequest extends ICreateRupRequest {
// 	methodist?: string // IUser.keycloakId
// }

// // update status
// export interface IUpdateRupStatusRequest {
// 	id: IRup['id'] // IUser.keycloakId
// 	status: IRup['status'] // IUser.keycloakId
// 	reason?: IRup['reason']
// }

// // download response
// export interface IDownloadResponse {
// 	url: string
// }

// // get all
// export interface IGetAllRequest extends IPaginationRequest {
// 	methodist?: string
// 	teacher?: string
// 	status?: StatusEnum[]
// }
