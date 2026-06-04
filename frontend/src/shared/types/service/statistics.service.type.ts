import type { IUser } from '../global.type'
import type { LocalizedText } from '../locale.type'

export interface IDepartmentTopTeachersResponse {
	keycloakId: string
	name: LocalizedText
	teachersCount: number
	teachers: IUser[]
}
