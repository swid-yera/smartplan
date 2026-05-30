import type { IAward, IReviewItem, IRup } from '@types'
import { getLocaleText } from './locale.helper'

export const mapRupToReviewItem = (rup: IRup): IReviewItem => ({
	id: rup.id,
	type: 'RUP',
	title: getLocaleText(rup.name, 'ru'),
	subtitle: getLocaleText(rup.groups[0]?.specialty),
	teacher: rup.teacher,
	status: rup.status,
	updatedAt: rup.updatedAt,
	raw: rup,
})

export const mapAwardToReviewItem = (award: IAward): IReviewItem => ({
	id: award.id,
	type: 'AWARD',
	title: `${getLocaleText(award.variant.name, 'ru')}, ${getLocaleText(award.criteria.name, 'ru')}`,
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
		title: getLocaleText(r.name, 'ru'),
		status: r.status,
		teacher: r.teacher,
		raw: r,
		updatedAt: r.updatedAt,
	}))

	const awardItems: IReviewItem[] = awards.map((a) => ({
		id: a.id,
		type: 'AWARD',
		title: `${getLocaleText(a.variant.name, 'ru')} / ${getLocaleText(a.criteria.name, 'ru')}`,
		status: a.status,
		teacher: a.teacher,
		raw: a,
		updatedAt: a.updatedAt,
	}))

	return [...rupItems, ...awardItems]
}
