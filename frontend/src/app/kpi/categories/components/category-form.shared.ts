import type {
	CategoryFieldChildType,
	CategoryFieldType,
	ICategoryFieldResponse,
	ICategoryMultiFieldOptionRequest,
	ICategoryMultiFieldOptionResponse,
	ICategoryResponse,
	Locale,
	LocaleText,
	LocalizedText,
} from '@types'

export const FIELD_TYPE_OPTIONS: CategoryFieldType[] = [
	'text',
	'textarea',
	'number',
	'select',
	'group',
	'date',
	'file',
	'url',
	'multi_fields',
]

export const FIELD_TYPE_LABELS: Record<CategoryFieldType, string> = {
	text: 'text',
	textarea: 'textarea',
	number: 'number',
	select: 'select',
	group: 'group',
	date: 'date',
	file: 'file',
	url: 'url',
	multi_fields: 'multi fields',
}

export const MULTI_FIELD_CHILD_TYPE_OPTIONS: CategoryFieldChildType[] = ['text', 'textarea', 'number', 'select', 'date']

export const MULTI_FIELD_CHILD_TYPE_LABELS: Record<CategoryFieldChildType, string> = {
	text: 'text',
	textarea: 'textarea',
	number: 'number',
	select: 'select',
	date: 'date',
}

export interface ICategoryMultiFieldOptionFormState {
	key: string
	label: Record<Locale, string>
	type: CategoryFieldChildType
	required: boolean
	placeholder: Record<Locale, string>
	helpText: Record<Locale, string>
	options: unknown[]
	validation: Record<string, unknown>
	sortOrder: number
}

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

export const createEmptyMultiFieldOption = (sortOrder: number): ICategoryMultiFieldOptionFormState => ({
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

const toLocaleRequestText = (value: Record<Locale, string>): LocaleText => {
	return {
		ru: value.ru.trim(),
		kz: value.kk.trim(),
	}
}

export const mapCategoryToFormFields = (category: ICategoryResponse): ICategoryFieldFormState[] => {
	return (category.fieldsExpanded || []).map((field, index) => mapCategoryFieldToFormState(field, index))
}

export const mapCategoryFieldToFormState = (field: ICategoryFieldResponse, index: number): ICategoryFieldFormState => ({
	key: field.key,
	label: toLocaleDraft(field.label),
	type: field.type,
	required: field.required,
	placeholder: toLocaleDraft(field.placeholder),
	helpText: toLocaleDraft(field.helpText),
	options: mapFieldOptionsToFormState(field.type, field.options),
	validation: field.validation || {},
	sortOrder: normalizeSortOrder(field.sortOrder, index + 1),
})

export const mapMultiFieldOptionToFormState = (
	option: ICategoryMultiFieldOptionResponse,
	index: number,
): ICategoryMultiFieldOptionFormState => ({
	key: option.key,
	label: toLocaleDraft(option.label),
	type: option.type,
	required: option.required,
	placeholder: toLocaleDraft(option.placeholder),
	helpText: toLocaleDraft(option.helpText),
	options: mapFieldOptionsToFormState(option.type, option.options),
	validation: option.validation || {},
	sortOrder: normalizeSortOrder(option.sortOrder, index + 1),
})

export const mapFieldOptionsToFormState = (type: CategoryFieldType, options: unknown): unknown[] => {
	if (!Array.isArray(options)) return []

	if (type === 'select') {
		return options.filter((option): option is string => typeof option === 'string')
	}

	if (type === 'multi_fields') {
		return options
			.filter((option): option is ICategoryMultiFieldOptionResponse => typeof option === 'object' && option !== null)
			.map((option, index) => mapMultiFieldOptionToFormState(option, index))
	}

	return []
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
	if (type === 'select') {
		return options
			.filter((option): option is string => typeof option === 'string')
			.map((option) => option.trim())
			.filter((option) => option.length > 0)
	}

	if (type === 'multi_fields') {
		return sanitizeMultiFieldOptions(options)
	}

	return []
}

export const sanitizeFieldValidation = (type: CategoryFieldType, validation: Record<string, unknown>) => {
	if (type === 'multi_fields') {
		return {}
	}

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

export const sanitizeMultiFieldOptions = (options: unknown[]): ICategoryMultiFieldOptionRequest[] => {
	return options
		.filter(
			(option): option is ICategoryMultiFieldOptionFormState =>
				typeof option === 'object' && option !== null && 'key' in option && 'type' in option,
		)
		.map((option, index) => {
			const key = option.key.trim()
			const type = MULTI_FIELD_CHILD_TYPE_OPTIONS.includes(option.type) ? option.type : 'text'
			const label = toLocaleRequestText(option.label)
			const placeholder =
				option.placeholder.ru.trim() || option.placeholder.kk.trim()
					? toLocaleRequestText(option.placeholder)
					: null
			const helpText =
				option.helpText.ru.trim() || option.helpText.kk.trim() ? toLocaleRequestText(option.helpText) : null

			return {
				key,
				type,
				label,
				placeholder,
				helpText,
				options: sanitizeMultiFieldChildOptions(type, option.options),
				validation: sanitizeMultiFieldChildValidation(type, option.validation),
				sortOrder: normalizeSortOrder(option.sortOrder, index + 1),
				required: option.required,
			}
		})
}

export const sanitizeMultiFieldChildOptions = (type: CategoryFieldChildType, options: unknown[]) => {
	if (type !== 'select') return []

	return options
		.filter((option): option is string => typeof option === 'string')
		.map((option) => option.trim())
		.filter((option) => option.length > 0)
}

export const sanitizeMultiFieldChildValidation = (
	type: CategoryFieldChildType,
	validation: Record<string, unknown>,
) => {
	const allowedKeysByType: Partial<Record<CategoryFieldChildType, string[]>> = {
		text: ['minLength', 'maxLength'],
		textarea: ['minLength', 'maxLength'],
		number: ['min', 'max'],
	}

	const allowedKeys = allowedKeysByType[type] || []

	return allowedKeys.reduce<Record<string, number>>((acc, key) => {
		const value = validation[key]
		const normalizedValue = typeof value === 'number' ? value : Number(value)

		if (Number.isFinite(normalizedValue)) {
			acc[key] = normalizedValue
		}

		return acc
	}, {})
}

export const isValidMultiFieldDefinition = (field: ICategoryFieldFormState) => {
	if (field.type !== 'multi_fields') return true

	const rawSubFields = Array.isArray(field.options) ? field.options : []

	if (rawSubFields.length === 0) {
		return false
	}

	const seen = new Set<string>()
	for (const subField of rawSubFields) {
		if (typeof subField !== 'object' || subField === null) return false
		const typedSubField = subField as ICategoryMultiFieldOptionFormState
		const normalizedKey = typedSubField.key.trim().toLowerCase()
		const isAllowedType = MULTI_FIELD_CHILD_TYPE_OPTIONS.includes(typedSubField.type)

		if (!normalizedKey) return false
		if (!typedSubField.label.ru.trim() && !typedSubField.label.kk.trim()) return false
		if (!isAllowedType) return false
		if (seen.has(normalizedKey)) return false
		seen.add(normalizedKey)
		if (
			typedSubField.type === 'select' &&
			sanitizeMultiFieldChildOptions(typedSubField.type, typedSubField.options).length === 0
		) {
			return false
		}
	}

	return true
}
