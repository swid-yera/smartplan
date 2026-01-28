import type { IAward } from './award.types'
import type { IUser, StatusEnum } from './global.types'
import type { IRup } from './rup.types'

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
