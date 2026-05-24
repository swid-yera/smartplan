import type { CategoryFieldType, ICategoryResponse, Locale, LocalizedText } from '@types'

export const FIELD_TYPE_OPTIONS: CategoryFieldType[] = ['text', 'textarea', 'number', 'select', 'date', 'file', 'url']

export interface ICategoryFieldFormState {
	key: string
	label: Record<Locale, string>
	type: CategoryFieldType
	required: boolean
	placeholder: Record<Locale, string>
	helpText: Record<Locale, string>
	options: unknown[]
	validation: Record<string, unknown>
	sortOrder: number
}

export const FILE_EXTENSION_TO_MIME: Record<string, string> = {
	pdf: 'application/pdf',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	txt: 'text/plain',
	csv: 'text/csv',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif',
	bmp: 'image/bmp',
	svg: 'image/svg+xml',
}

export const FILE_EXTENSION_OPTIONS = [
	{ extension: 'pdf', label: 'PDF (.pdf)' },
	{ extension: 'doc', label: 'Word 97-2003 (.doc)' },
	{ extension: 'docx', label: 'Word (.docx)' },
	{ extension: 'xls', label: 'Excel 97-2003 (.xls)' },
	{ extension: 'xlsx', label: 'Excel (.xlsx)' },
	{ extension: 'ppt', label: 'PowerPoint 97-2003 (.ppt)' },
	{ extension: 'pptx', label: 'PowerPoint (.pptx)' },
	{ extension: 'txt', label: 'Text (.txt)' },
	{ extension: 'csv', label: 'CSV (.csv)' },
	{ extension: 'png', label: 'PNG (.png)' },
	{ extension: 'jpg', label: 'JPG (.jpg)' },
	{ extension: 'jpeg', label: 'JPEG (.jpeg)' },
	{ extension: 'webp', label: 'WEBP (.webp)' },
	{ extension: 'gif', label: 'GIF (.gif)' },
	{ extension: 'bmp', label: 'BMP (.bmp)' },
	{ extension: 'svg', label: 'SVG (.svg)' },
]

export const normalizeSortOrder = (sortOrder: unknown, fallback: number) => {
	const parsedValue = typeof sortOrder === 'number' ? sortOrder : Number(sortOrder)

	if (Number.isFinite(parsedValue) && parsedValue > 0) {
		return Math.trunc(parsedValue)
	}

	return fallback
}

export const createEmptyField = (sortOrder: number): ICategoryFieldFormState => ({
	key: '',
	label: { ru: '', kk: '' },
	type: 'text',
	required: false,
	placeholder: { ru: '', kk: '' },
	helpText: { ru: '', kk: '' },
	options: [],
	validation: {},
	sortOrder,
})

export const toLocaleDraft = (value: LocalizedText): Record<Locale, string> => {
	if (!value) return { ru: '', kk: '' }

	if (typeof value === 'string') {
		return { ru: value, kk: value }
	}

	return {
		ru: value.ru || '',
		kk: value.kz || '',
	}
}

export const mapCategoryToFormFields = (category: ICategoryResponse): ICategoryFieldFormState[] => {
	return (category.fieldsExpanded || []).map((field, index) => ({
		key: field.key,
		label: toLocaleDraft(field.label),
		type: field.type,
		required: field.required,
		placeholder: toLocaleDraft(field.placeholder),
		helpText: toLocaleDraft(field.helpText),
		options: Array.isArray(field.options)
			? field.options.filter((option): option is string => typeof option === 'string')
			: [],
		validation: field.validation || {},
		sortOrder: normalizeSortOrder(field.sortOrder, index + 1),
	}))
}

export const getValidationNumberValue = (validation: Record<string, unknown>, key: string) => {
	const value = validation[key]

	if (typeof value === 'number' && Number.isFinite(value)) return String(value)
	if (typeof value === 'string' && value.trim()) return value

	return ''
}

export const getValidationStringArray = (validation: Record<string, unknown>, key: string) => {
	const value = validation[key]

	if (!Array.isArray(value)) return []

	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean)
}

export const sanitizeFieldOptions = (type: CategoryFieldType, options: unknown[]) => {
	if (type !== 'select') return []

	return options
		.filter((option): option is string => typeof option === 'string')
		.map((option) => option.trim())
		.filter((option) => option.length > 0)
}

export const sanitizeFieldValidation = (type: CategoryFieldType, validation: Record<string, unknown>) => {
	const numericValidationKeysByType: Partial<Record<CategoryFieldType, string[]>> = {
		text: ['minLength', 'maxLength'],
		textarea: ['minLength', 'maxLength'],
		number: ['min', 'max'],
		file: ['maxSizeMb'],
	}

	const allowedKeys = numericValidationKeysByType[type] || []

	const numericValidation = allowedKeys.reduce<Record<string, number>>((acc, key) => {
		const value = validation[key]
		const normalizedValue = typeof value === 'number' ? value : Number(value)

		if (Number.isFinite(normalizedValue)) {
			acc[key] = normalizedValue
		}

		return acc
	}, {})

	if (type !== 'file') {
		return numericValidation
	}

	const normalizedExtensions = getValidationStringArray(validation, 'extensions')
		.map((extension) => extension.replace(/^\./, '').toLowerCase())
		.filter((extension) => Boolean(FILE_EXTENSION_TO_MIME[extension]))

	if (!normalizedExtensions.length) {
		return numericValidation
	}

	return {
		...numericValidation,
		extensions: normalizedExtensions,
		mimeTypes: normalizedExtensions.map((extension) => FILE_EXTENSION_TO_MIME[extension]),
	}
}
