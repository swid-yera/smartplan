import type { IAward } from './award.type'
import type { IUser, StatusEnum } from './global.type'
import type { IRup } from './rup.type'

export type ReviewEntityType = 'RUP' | 'AWARD' | 'LESSON'

export interface IReviewItem {
	id: string
	type: ReviewEntityType

	title: string
	subtitle?: string

	teacher: IUser
	points?: number
	filesCount?: number

	status: StatusEnum
	updatedAt: string

	raw: IRup | IAward
}
