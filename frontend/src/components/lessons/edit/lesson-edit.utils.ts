import { PRACTICE_PROGRESS, THEORY_PROGRESS } from '@constants'
import { createLocaleText, getLocaleText } from '@helpers'
import type { ILesson, Locale, LocalizedText } from '@types'
import { LessonResourceTypeEnum, LessonTypeEnum } from '@types'
import { isAxiosError } from 'axios'

import type { ILessonFormState, ILessonProgressRow, IResourceRow } from './lesson-edit.types'

export function createLocaleDraft(value?: LocalizedText): Record<Locale, string> {
	if (!value) return { ru: '', kk: '' }

	if (typeof value === 'string') {
		return { ru: value, kk: value }
	}

	return {
		ru: value.ru || '',
		kk: value.kz || '',
	}
}

export function createEmptyResource(): IResourceRow {
	return {
		link: '',
		name: { ru: '', kk: '' },
	}
}

export function createEmptyLessonProgress(): ILessonProgressRow {
	return {
		contentText: '',
		name: { ru: '', kk: '' },
		firstTime: 0,
		secondTime: 0,
		thirdTime: 0,
	}
}

export function mapResourcesForForm(items: ILesson['internet_resources']): IResourceRow[] {
	if (!items.length) return [createEmptyResource()]

	return items.map((item) => ({
		id: item.id,
		link: item.link || '',
		name: createLocaleDraft(item.name),
	}))
}

export function mapLessonProgressForForm(lesson: ILesson): ILessonProgressRow[] {
	const templateByType = lesson.type === LessonTypeEnum.PRACTICE ? PRACTICE_PROGRESS : THEORY_PROGRESS
	const source = lesson.lesson_progress.length ? lesson.lesson_progress : templateByType
	const resolveProgressValue = (
		item: {
			firstTime?: number[] | string[]
			secondTime?: number[] | string[]
			thirdTime?: number[] | string[]
			first_time?: number[] | string[]
			second_time?: number[] | string[]
			third_time?: number[] | string[]
		},
		key: 'firstTime' | 'secondTime' | 'thirdTime',
		snakeKey: 'first_time' | 'second_time' | 'third_time',
	): number => Math.max(0, Number(item[key]?.[0] ?? item[snakeKey]?.[0] ?? 0) || 0)

	return source.map((item, index) => ({
		id: 'id' in item && typeof item.id === 'string' && item.id.trim() ? item.id : `template-${lesson.type}-${index}`,
		contentText: (item.content || []).join('\n'),
		firstTime: resolveProgressValue(item, 'firstTime', 'first_time'),
		name: createLocaleDraft(item.name),
		secondTime: resolveProgressValue(item, 'secondTime', 'second_time'),
		thirdTime: resolveProgressValue(item, 'thirdTime', 'third_time'),
	}))
}

export function normalizeResources(items: IResourceRow[], type: LessonResourceTypeEnum) {
	return items
		.map((item) => ({
			id: item.id,
			link: item.link.trim(),
			name: createLocaleText(item.name.ru.trim(), item.name.kk.trim()),
			type,
		}))
		.filter((item) => item.name.ru.trim() || item.name.kz.trim())
}

export function normalizeLessonProgressForRequest(items: ILessonProgressRow[]) {
	return items
		.map((item) => {
			const content = item.contentText
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean)

			return {
				content,
				third_time: [Math.max(0, Number(item.thirdTime) || 0)],
				id: item.id,
				name: createLocaleText(item.name.ru.trim(), item.name.kk.trim()),
				second_time: [Math.max(0, Number(item.secondTime) || 0)],
				first_time: [Math.max(0, Number(item.firstTime) || 0)],
			}
		})
		.filter((item) => Boolean(item.name.ru.trim() || item.name.kz.trim() || item.content.length))
}

export function toEventDateFormState(value?: string | null): Pick<ILessonFormState, 'eventDate' | 'eventTime'> {
	if (!value) {
		return {
			eventDate: undefined,
			eventTime: '',
		}
	}

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) {
		return {
			eventDate: undefined,
			eventTime: '',
		}
	}

	const timezoneOffsetMs = date.getTimezoneOffset() * 60_000
	const localDate = new Date(date.getTime() - timezoneOffsetMs)
	const [localDateValue, localTimeValue] = localDate.toISOString().slice(0, 16).split('T')

	return {
		eventDate: localDateValue ? new Date(`${localDateValue}T00:00:00`) : undefined,
		eventTime: localTimeValue || '',
	}
}

export function toIsoFromDateAndTimeInput(eventDate: Date | undefined, eventTime: string, fallback: string): string {
	if (!eventDate || !eventTime) {
		return fallback
	}

	const [hours, minutes] = eventTime.split(':')
	const date = new Date(eventDate)
	const parsedHours = Number.parseInt(hours, 10)
	const parsedMinutes = Number.parseInt(minutes, 10)

	date.setHours(Number.isFinite(parsedHours) ? parsedHours : 0)
	date.setMinutes(Number.isFinite(parsedMinutes) ? parsedMinutes : 0)
	date.setSeconds(0, 0)

	if (Number.isNaN(date.getTime())) {
		return fallback
	}

	return date.toISOString()
}

function isValid24HourTime(value: string): boolean {
	return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

export function getEventTimeError(value: string): string | null {
	if (!value) {
		return 'Укажите время проведения'
	}

	if (!isValid24HourTime(value)) {
		return 'Укажите время в формате 24 часа (HH:mm)'
	}

	return null
}

export function sanitizeTimeInput(value: string): string {
	const cleanedValue = value.replaceAll(/[^\d:]/g, '')
	const [left = '', ...rightParts] = cleanedValue.split(':')
	const hasColon = cleanedValue.includes(':')

	if (hasColon) {
		return `${left.slice(0, 2)}:${rightParts.join('').slice(0, 2)}`
	}

	return left.slice(0, 4)
}

export function normalizeTimeInputOnBlur(value: string): string {
	const sanitized = sanitizeTimeInput(value)

	if (!sanitized) {
		return ''
	}

	const hasColon = sanitized.includes(':')
	const [hourPart = '', ...minuteParts] = sanitized.split(':')
	const digitsOnly = sanitized.replaceAll(/\D/g, '')

	let hour = hourPart
	let minute = minuteParts.join('')

	if (!hasColon) {
		if (digitsOnly.length <= 2) {
			return digitsOnly
		}

		hour = digitsOnly.slice(0, 2)
		minute = digitsOnly.slice(2, 4)
	}

	if (!hour) {
		return ''
	}

	if (!minute) {
		return sanitized
	}

	return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

export function extractSaveErrorMessage(error: unknown): string {
	if (isAxiosError(error)) {
		const responseData = error.response?.data

		if (typeof responseData === 'string' && responseData.trim()) {
			return responseData
		}

		if (typeof responseData === 'object' && responseData !== null) {
			const message = responseData.message
			const backendError = responseData.error

			if (typeof message === 'string' && message.trim()) {
				return message
			}

			if (Array.isArray(message) && message.length) {
				return message.join(', ')
			}

			if (typeof backendError === 'string' && backendError.trim()) {
				return backendError
			}
		}

		return error.message || 'Ошибка при сохранении урока'
	}

	if (error instanceof Error) {
		return error.message
	}

	return 'Ошибка при сохранении урока'
}

export function serializeSaveError(error: unknown) {
	if (isAxiosError(error)) {
		return {
			message: error.message,
			method: error.config?.method,
			response: error.response?.data,
			status: error.response?.status,
			statusText: error.response?.statusText,
			url: error.config?.url,
		}
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
			stack: error.stack,
		}
	}

	return {
		error,
	}
}
