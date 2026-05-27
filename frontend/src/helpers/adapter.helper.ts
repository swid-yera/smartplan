import type { IAward, IReviewItem, IRup } from '@types'
import { getLocaleText } from './locale.helper'

export const mapRupToReviewItem = (rup: IRup): IReviewItem => ({
	id: rup.id,
	type: 'RUP',
	title: rup.name,
	subtitle: getLocaleText(rup.groups[0]?.specialty),
	teacher: rup.teacher,
	status: rup.status,
	updatedAt: rup.updatedAt,
	raw: rup,
})

export const mapAwardToReviewItem = (award: IAward): IReviewItem => ({
	id: award.id,
	type: 'AWARD',
	title: `${award.variant.name}, ${award.criteria.name}`,
	subtitle: award.text,
	teacher: award.teacher,
	points: award.totalPoints,
	filesCount: award.files?.length,
	status: award.status,
	updatedAt: award.updatedAt,
	raw: award,
})

// build review items
export const buildReviewItems = (rups: IRup[] = [], awards: IAward[] = []): IReviewItem[] => {
	const rupItems: IReviewItem[] = rups.map((r) => ({
		id: r.id,
		type: 'RUP',
		title: r.name,
		status: r.status,
		teacher: r.teacher,
		raw: r,
		updatedAt: r.updatedAt,
	}))

	const awardItems: IReviewItem[] = awards.map((a) => ({
		id: a.id,
		type: 'AWARD',
		title: `${a.variant.name} / ${a.criteria.name}`,
		status: a.status,
		teacher: a.teacher,
		raw: a,
		updatedAt: a.updatedAt,
	}))

	return [...rupItems, ...awardItems]
}
