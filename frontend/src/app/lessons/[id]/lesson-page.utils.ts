import type { ILessonProgressContext, INormalizedLessonProgress } from './lesson-page.types'

function toMinute(value: number | string | Array<number | string> | undefined): number {
	if (Array.isArray(value)) {
		return toMinute(value[0])
	}

	const parsed = Number(value)

	if (!Number.isFinite(parsed) || parsed < 0) return 0

	return parsed
}

export function normalizeLessonProgress(items?: ILessonProgressContext[]): INormalizedLessonProgress[] {
	if (!items?.length) return []

	return items.map((item, index) => {
		const contentItems = Array.isArray(item.content)
			? item.content
			: typeof item.content === 'string'
				? item.content.split('\n')
				: []
		const content = contentItems.map((line) => line.trim()).filter(Boolean)

		return {
			id: item.id || `lesson-progress-${index}`,
			name: (item.name || '').trim(),
			content,
			firstTime: toMinute(item.firstTime),
			secondTime: toMinute(item.secondTime),
			thirdTime: toMinute(item.thirdTime),
		}
	})
}

export function formatMinuteRange(firstTime: number, secondTime: number, thirdTime: number): string {
	return `${firstTime}/${secondTime}/${thirdTime}мин.`
}

export function formatDate(value?: string | null) {
	if (!value) return 'Пусто'

	const parsed = new Date(value)

	if (Number.isNaN(parsed.getTime())) return value

	return new Intl.DateTimeFormat('ru-KZ', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(parsed)
}
