import type { CriteriaMethodEnum } from '@types'

// count files from images and document fields from award
export const awardCountDocument = (images?: string[], document?: string): number => {
	const imagesCount = images?.length ?? 0
	const documentCount = document ? 1 : 0

	return imagesCount + documentCount
}

// criteria method enum
const criteriaMethodLabels: Record<CriteriaMethodEnum, string> = {
	MEASURING: 'Оценка по диапазону',
	NORMAL: 'Фиксированное количество баллов',
}

// normalize criteria method
export const normalizeCriteriaMethod = (criteriaMethod: CriteriaMethodEnum, points?: number[]) => {
	const label = criteriaMethodLabels[criteriaMethod]

	if (!points || points.length == 0) return label
	if (points.length == 2) return `${label}, ${points[0]} - ${points[1]}`

	return `${label}, ${points[0]} балла`
}

export const normalizeTotalPoints = (points: number = 0): string => {
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
