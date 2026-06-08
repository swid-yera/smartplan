import { interpolateUILocaleText } from '@helpers'
import type {
	ICategoryFieldResponse,
	ICategoryMultiFieldOptionResponse,
	ICategoryMultiFieldRowValue,
	Locale,
} from '@types'
import { isAfter, isValid as isValidDate, parseISO, startOfDay } from 'date-fns'

import locale from './locale.json'

export type ICategoryFieldValue = string | number | File[] | ICategoryMultiFieldRowValue[]
export type ICategoryFieldValues = Record<string, ICategoryFieldValue>

const URL_WITHOUT_PROTOCOL_REGEX =
	/^(?=.{1,2048}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[A-Za-z]{2,}(?::\d{2,5})?(?:[/?#][^\s]*)?$/

export const capitalizeFirstLetter = (value: string) => {
	const trimmedValue = value.trim()

	if (!trimmedValue) return value

	return `${trimmedValue.charAt(0).toUpperCase()}${trimmedValue.slice(1)}`
}

export const buildInitialCategoryFieldValues = (fields: ICategoryFieldResponse[]): ICategoryFieldValues => {
	return fields.reduce<ICategoryFieldValues>((acc, field) => {
		if (field.type === 'file') {
			acc[field.key] = []

			return acc
		}

		if (field.type === 'multi_fields') {
			acc[field.key] = []

			return acc
		}

		acc[field.key] = ''

		return acc
	}, {})
}

const isBrowserFile = (value: unknown): value is File => {
	return typeof File !== 'undefined' && value instanceof File
}

export const isFileFieldValueArray = (value: ICategoryFieldValue | undefined): value is File[] => {
	return Array.isArray(value) && value.every(isBrowserFile)
}

export const isMultiFieldRowArray = (
	value: ICategoryFieldValue | undefined,
): value is ICategoryMultiFieldRowValue[] => {
	return (
		Array.isArray(value) &&
		value.every((item) => typeof item === 'object' && item !== null && !Array.isArray(item) && !isBrowserFile(item))
	)
}

export const createEmptyMultiFieldRow = (fields: Array<Pick<ICategoryFieldResponse, 'key' | 'type'>>) => {
	return fields.reduce<ICategoryMultiFieldRowValue>((acc, field) => {
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

		return isFileFieldValueArray(value) ? value : []
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
		const files = isFileFieldValueArray(value) ? value : []

		if (!files.length) return null

		const maxSizeMb = getValidationNumber(field.validation, 'maxSizeMb')
		const allowedExtensions = getValidationStringArray(field.validation, 'extensions').map((item) =>
			item.replace(/^\./, '').toLowerCase(),
		)
		const maxSizeBytes = maxSizeMb !== null ? maxSizeMb * 1024 * 1024 : null

		for (const file of files) {
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

	if (field.type === 'multi_fields') {
		return getMultiFieldValidationError(field, value, currentLocale)
	}

	return null
}

const getMultiFieldValidationError = (
	field: ICategoryFieldResponse,
	value: ICategoryFieldValue | undefined,
	currentLocale: Locale,
) => {
	const t = locale[currentLocale] ?? locale.ru
	const options = Array.isArray(field.options)
		? field.options.filter(
				(option): option is ICategoryMultiFieldOptionResponse =>
					typeof option === 'object' && option !== null && 'key' in option && 'type' in option,
			)
		: []

	if (!isMultiFieldRowArray(value)) {
		return t.errors.invalidMultiFieldValue
	}

	if (field.required && value.length === 0) {
		return t.errors.requiredMultiFieldGroup
	}

	const childByKey = new Map(options.map((option) => [option.key, option]))

	for (let rowIndex = 0; rowIndex < value.length; rowIndex += 1) {
		const row = value[rowIndex]

		if (!row || typeof row !== 'object' || Array.isArray(row)) {
			return interpolateUILocaleText(t.errors.invalidMultiFieldRow, { index: rowIndex + 1 })
		}

		for (const key of Object.keys(row)) {
			if (!childByKey.has(key)) {
				return interpolateUILocaleText(t.errors.unknownMultiFieldField, { field: key })
			}
		}

		for (const childField of options) {
			const rawValue = row[childField.key]

			if (childField.required && !hasProvidedMultiFieldValue(rawValue)) {
				return interpolateUILocaleText(t.errors.requiredMultiFieldField, {
					field: getMultiFieldFieldLabel(childField, currentLocale),
				})
			}

			const childError = getCategoryFieldValidationError(
				childField as unknown as ICategoryFieldResponse,
				normalizeMultiFieldValue(rawValue),
				currentLocale,
			)

			if (childError) {
				return childError
			}
		}
	}

	return null
}

const getMultiFieldFieldLabel = (field: ICategoryMultiFieldOptionResponse, currentLocale: Locale) => {
	const localized = field.label

	if (typeof localized === 'string') {
		return localized
	}

	if (!localized) {
		return field.key
	}

	return currentLocale === 'ru' ? localized.ru || localized.kz || field.key : localized.kz || localized.ru || field.key
}

const normalizeMultiFieldValue = (value: unknown) => {
	if (typeof value === 'number' || typeof value === 'string') return value

	return undefined
}

const hasProvidedMultiFieldValue = (value: unknown) => {
	if (value === null || value === undefined) return false

	if (typeof value === 'string') {
		return value.trim().length > 0
	}

	if (typeof value === 'number') {
		return Number.isFinite(value)
	}

	return false
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

const isFieldLike = (value: unknown): value is ICategoryFieldResponse => {
	return typeof value === 'object' && value !== null && 'key' in value && 'type' in value && 'label' in value
}

export const serializeCategoryFieldValue = (
	field: ICategoryFieldResponse,
	value: ICategoryFieldValue | undefined,
): string | string[] | number | ICategoryMultiFieldRowValue[] | undefined => {
	if (field.type === 'file') {
		return undefined
	}

	if (field.type === 'multi_fields') {
		if (!isMultiFieldRowArray(value)) return []

		const subFields = Array.isArray(field.options) ? field.options.filter(isFieldLike) : []

		return value
			.map((row) => {
				if (!row || typeof row !== 'object' || Array.isArray(row)) {
					return null
				}

				const normalizedRow: ICategoryMultiFieldRowValue = {}

				for (const subField of subFields) {
					const rawRowValue = row[subField.key]
					const serializedValue = serializeMultiFieldChildValue(subField, rawRowValue)

					if (serializedValue === undefined) continue

					normalizedRow[subField.key] = serializedValue
				}

				return Object.keys(normalizedRow).length > 0 ? normalizedRow : null
			})
			.filter((row): row is ICategoryMultiFieldRowValue => !!row)
	}

	if (field.type === 'number') {
		if (typeof value === 'string') {
			const trimmedValue = value.trim()

			if (!trimmedValue) return undefined

			const parsedValue = Number(trimmedValue)

			return Number.isFinite(parsedValue) ? parsedValue : undefined
		}

		if (typeof value === 'number' && Number.isFinite(value)) {
			return value
		}

		return undefined
	}

	if (field.type === 'url') {
		if (typeof value !== 'string') return ''

		return normalizeUrlWithoutProtocol(value)
	}

	if (typeof value === 'string') {
		return value
	}

	if (Array.isArray(value)) {
		const firstValue = value.find((item) => typeof item === 'string')

		return typeof firstValue === 'string' ? firstValue : ''
	}

	return ''
}

const serializeMultiFieldChildValue = (field: ICategoryFieldResponse, value: unknown): string | number | undefined => {
	if (field.type === 'number') {
		if (typeof value === 'number' && Number.isFinite(value)) return value
		if (typeof value !== 'string') return undefined

		const trimmedValue = value.trim()

		if (!trimmedValue) return undefined

		const parsedValue = Number(trimmedValue)

		return Number.isFinite(parsedValue) ? parsedValue : undefined
	}

	if (typeof value !== 'string') return undefined

	return value
}
