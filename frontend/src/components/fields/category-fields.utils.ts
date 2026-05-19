import type { ICategoryFieldResponse } from '@types'
import { isAfter, isValid as isValidDate, parseISO, startOfDay } from 'date-fns'

export type ICategoryFieldValue = string | File[]
export type ICategoryFieldValues = Record<string, ICategoryFieldValue>

const URL_WITHOUT_PROTOCOL_REGEX =
	/^(?=.{1,2048}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,}(?::\d{2,5})?(?:[/?#][^\s]*)?$/

export const buildInitialCategoryFieldValues = (fields: ICategoryFieldResponse[]): ICategoryFieldValues => {
	return fields.reduce<ICategoryFieldValues>((acc, field) => {
		if (field.type === 'file') {
			acc[field.key] = []

			return acc
		}

		acc[field.key] = ''

		return acc
	}, {})
}

export const normalizeUrlWithoutProtocol = (value: string) => {
	return value
		.trim()
		.replace(/^https?:\/\//i, '')
		.replace(/^\/+/, '')
}

export const isValidUrlWithoutProtocol = (value: string) => {
	return URL_WITHOUT_PROTOCOL_REGEX.test(value)
}

export const parseDateFromFieldValue = (value: ICategoryFieldValue | undefined) => {
	if (typeof value !== 'string') return null
	if (!value.trim()) return null

	const parsedDate = parseISO(value)

	return isValidDate(parsedDate) ? parsedDate : null
}

export const isFutureDate = (date: Date) => {
	return isAfter(startOfDay(date), startOfDay(new Date()))
}

export const findMissingRequiredCategoryField = (fields: ICategoryFieldResponse[], values: ICategoryFieldValues) => {
	return fields.find((field) => {
		if (!field.required) return false

		const value = values[field.key]

		if (Array.isArray(value)) return value.length === 0

		return !String(value || '').trim()
	})
}

export const findInvalidUrlCategoryField = (fields: ICategoryFieldResponse[], values: ICategoryFieldValues) => {
	return fields.find((field) => {
		if (field.type !== 'url') return false

		const rawValue = values[field.key]
		const value = typeof rawValue === 'string' ? rawValue.trim() : ''

		if (!value) return false

		return !isValidUrlWithoutProtocol(value)
	})
}

export const findFutureDateCategoryField = (fields: ICategoryFieldResponse[], values: ICategoryFieldValues) => {
	return fields.find((field) => {
		if (field.type !== 'date') return false

		const parsedDate = parseDateFromFieldValue(values[field.key])

		if (!parsedDate) return false

		return isFutureDate(parsedDate)
	})
}

export const collectCategoryFieldFiles = (fields: ICategoryFieldResponse[], values: ICategoryFieldValues) => {
	return fields.flatMap((field) => {
		if (field.type !== 'file') return []

		const value = values[field.key]

		if (!Array.isArray(value)) return []

		return value
	})
}
