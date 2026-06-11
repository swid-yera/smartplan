import type { CriteriaMethodEnum, Locale } from '@types'

// count files from images and document fields from award
export const awardCountDocument = (images?: string[], document?: string): number => {
	const imagesCount = images?.length ?? 0
	const documentCount = document ? 1 : 0

	return imagesCount + documentCount
}

// criteria method enum
const criteriaMethodLabelsByLocale: Record<Locale, Record<CriteriaMethodEnum, string>> = {
	ru: {
		MEASURING: 'Оценка по диапазону',
		NORMAL: 'Фиксированное количество баллов',
	},
	kk: {
		MEASURING: 'Аралық бойынша бағалау',
		NORMAL: 'Тұрақты балл саны',
	},
}

// normalize criteria method
export const normalizeCriteriaMethod = (
	criteriaMethod: CriteriaMethodEnum,
	points?: number[],
	locale: Locale = 'ru',
) => {
	const labels = criteriaMethodLabelsByLocale[locale] || criteriaMethodLabelsByLocale.ru
	const label = labels[criteriaMethod]

	if (!points || points.length == 0) return label
	if (points.length == 2) return `${label}, ${points[0]} - ${points[1]}`
	if (locale === 'kk') return `${label}, ${points[0]} ұпай`

	return `${label}, ${points[0]} балла`
}

export const normalizeTotalPoints = (points: number = 0, locale: Locale = 'ru'): string => {
	if (locale === 'kk') return `${points} ұпай`

	const absPoints = Math.abs(points)
	const lastTwo = absPoints % 100
	const lastDigit = absPoints % 10

	if (lastTwo >= 11 && lastTwo <= 14) {
		return `${points} баллов`
	}

	if (lastDigit === 1) {
		return `${points} балл`
	}

	if (lastDigit >= 2 && lastDigit <= 4) {
		return `${points} балла`
	}

	return `${points} баллов`
}

export const formatCriteriaPoints = (points: number[]): string => {
	if (!points?.length) return ''
	if (points.length === 1) return `${points[0]}`

	return `${points[0]} – ${points[1]}`
}
