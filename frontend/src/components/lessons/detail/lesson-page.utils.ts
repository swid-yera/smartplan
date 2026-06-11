import { getLocaleText } from '@helpers'
import type { Locale } from '@types'

import type { ILessonProgressContext, INormalizedLessonProgress } from './lesson-page.types'

function toMinute(value: number | string | Array<number | string> | undefined): number {
	if (Array.isArray(value)) {
		return toMinute(value[0])
	}

	const parsed = Number(value)

	if (!Number.isFinite(parsed) || parsed < 0) return 0

	return parsed
}

function resolveProgressValue(
	item: ILessonProgressContext,
	camelKey: 'firstTime' | 'secondTime' | 'thirdTime',
	snakeKey: 'first_time' | 'second_time' | 'third_time',
): number | string | Array<number | string> | undefined {
	if (item[camelKey] !== undefined) {
		return item[camelKey]
	}

	return item[snakeKey]
}

export function normalizeLessonProgress(
	items?: ILessonProgressContext[],
	locale: Locale = 'ru',
): INormalizedLessonProgress[] {
	if (!items?.length) return []

	return items.map((item, index) => {
		const contentItems = Array.isArray(item.content)
			? item.content
			: typeof item.content === 'string'
				? item.content.split('\n')
				: []
		const content = contentItems.map((line) => getLocaleText(line, locale).trim()).filter(Boolean)

		return {
			id: item.id || `lesson-progress-${index}`,
			name: getLocaleText(item.name, locale) || '',
			content,
			firstTime: toMinute(resolveProgressValue(item, 'firstTime', 'first_time')),
			secondTime: toMinute(resolveProgressValue(item, 'secondTime', 'second_time')),
			thirdTime: toMinute(resolveProgressValue(item, 'thirdTime', 'third_time')),
		}
	})
}

export function formatMinuteRange(firstTime: number, secondTime: number, thirdTime: number): string {
	return `${firstTime}/${secondTime}/${thirdTime}мин.`
}

export function formatDate(value?: string | null, locale: Locale = 'ru') {
	if (!value) return locale === 'kk' ? 'Бос' : 'Пусто'

	const parsed = new Date(value)

	if (Number.isNaN(parsed.getTime())) return value

	return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(parsed)
}
