import { interpolateUILocaleText } from '@helpers'
import type { ICategoryFieldResponse, Locale } from '@types'
import { isAfter, isValid as isValidDate, parseISO, startOfDay } from 'date-fns'

import locale from './locale.json'

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

const getValidationNumber = (validation: Record<string, unknown>, key: string) => {
	const rawValue = validation?.[key]
	const parsedValue = typeof rawValue === 'number' ? rawValue : Number(rawValue)

	return Number.isFinite(parsedValue) ? parsedValue : null
}

const getValidationStringArray = (validation: Record<string, unknown>, key: string) => {
	const rawValue = validation?.[key]

	if (!Array.isArray(rawValue)) return []

	return rawValue
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean)
}

const getFileExtension = (fileName: string) => {
	const extension = fileName.split('.').pop()?.toLowerCase()

	return extension || ''
}

export const getCategoryFieldValidationError = (
	field: ICategoryFieldResponse,
	value: ICategoryFieldValue | undefined,
	currentLocale: Locale = 'ru',
): string | null => {
	const t = locale[currentLocale] ?? locale.ru

	if (field.type === 'text' || field.type === 'textarea') {
		if (typeof value !== 'string' || !value.length) return null

		const minLength = getValidationNumber(field.validation, 'minLength')
		const maxLength = getValidationNumber(field.validation, 'maxLength')

		if (minLength !== null && value.length < minLength) {
			return interpolateUILocaleText(t.errors.minLength, { value: minLength })
		}

		if (maxLength !== null && value.length > maxLength) {
			return interpolateUILocaleText(t.errors.maxLength, { value: maxLength })
		}

		return null
	}

	if (field.type === 'number') {
		if (typeof value !== 'string' || !value.trim()) return null

		const numberValue = Number(value)

		if (!Number.isFinite(numberValue)) {
			return t.errors.invalidNumber
		}

		const min = getValidationNumber(field.validation, 'min')
		const max = getValidationNumber(field.validation, 'max')

		if (min !== null && numberValue < min) {
			return interpolateUILocaleText(t.errors.minValue, { value: min })
		}

		if (max !== null && numberValue > max) {
			return interpolateUILocaleText(t.errors.maxValue, { value: max })
		}

		return null
	}

	if (field.type === 'file') {
		if (!Array.isArray(value) || !value.length) return null

		const maxSizeMb = getValidationNumber(field.validation, 'maxSizeMb')
		const allowedExtensions = getValidationStringArray(field.validation, 'extensions').map((item) =>
			item.replace(/^\./, '').toLowerCase(),
		)
		const maxSizeBytes = maxSizeMb !== null ? maxSizeMb * 1024 * 1024 : null

		for (const file of value) {
			if (maxSizeBytes !== null && file.size > maxSizeBytes) {
				return interpolateUILocaleText(t.errors.maxFileSize, { value: maxSizeMb || 0 })
			}

			if (allowedExtensions.length > 0) {
				const extension = getFileExtension(file.name)

				if (!extension || !allowedExtensions.includes(extension)) {
					return interpolateUILocaleText(t.errors.invalidFileExtension, { name: file.name })
				}
			}
		}
	}

	return null
}

export const findInvalidCategoryFieldByValidation = (
	fields: ICategoryFieldResponse[],
	values: ICategoryFieldValues,
	currentLocale: Locale = 'ru',
) => {
	return fields.find((field) => {
		const error = getCategoryFieldValidationError(field, values[field.key], currentLocale)

		return Boolean(error)
	})
}
