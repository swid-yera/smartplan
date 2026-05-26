'use client'

import { getLocaleText } from '@helpers'
import { Dropzone, DropzoneContent, DropzoneEmptyState, Label } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ICategoryFieldResponse } from '@types'

type CategoryFileFieldInputProps = {
	field: ICategoryFieldResponse
	value: File[]
	onChange: (fieldKey: string, files: File[]) => void
}

const FALLBACK_ACCEPT: Record<string, string[]> = {
	'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'],
	'application/pdf': ['.pdf'],
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
	'application/vnd.ms-excel': ['.xls'],
	'application/vnd.ms-powerpoint': ['.ppt'],
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
	'text/plain': ['.txt'],
	'text/csv': ['.csv'],
	'text/markdown': ['.md'],
	'application/zip': ['.zip'],
	'application/x-rar-compressed': ['.rar'],
	'application/x-7z-compressed': ['.7z'],
}

const parseValidationStringArray = (value: unknown) => {
	if (!Array.isArray(value)) return []

	return value
		.filter((item): item is string => typeof item === 'string')
		.map((item) => item.trim())
		.filter(Boolean)
}

const buildAcceptFromFieldValidation = (field: ICategoryFieldResponse) => {
	const extensions = parseValidationStringArray(field.validation?.extensions).map((item) =>
		item.replace(/^\./, '').toLowerCase(),
	)
	const mimeTypes = parseValidationStringArray(field.validation?.mimeTypes)

	if (!extensions.length) return FALLBACK_ACCEPT

	const accept = extensions.reduce<Record<string, string[]>>((acc, extension, index) => {
		const mimeType = mimeTypes[index]

		if (!mimeType) return acc

		const normalizedExtension = `.${extension}`
		const currentExtensions = acc[mimeType] || []

		if (!currentExtensions.includes(normalizedExtension)) {
			acc[mimeType] = [...currentExtensions, normalizedExtension]
		}

		return acc
	}, {})

	return Object.keys(accept).length ? accept : FALLBACK_ACCEPT
}

const getMaxFilesFromFieldValidation = (field: ICategoryFieldResponse) => {
	const rawMaxFiles = field.validation?.maxFiles
	const parsedMaxFiles = typeof rawMaxFiles === 'number' ? rawMaxFiles : Number(rawMaxFiles)

	if (!Number.isFinite(parsedMaxFiles) || parsedMaxFiles < 1) {
		return 10
	}

	return Math.floor(parsedMaxFiles)
}

export const CategoryFileFieldInput = ({ field, value, onChange }: CategoryFileFieldInputProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const labelText = getLocaleText(field.label, locale)
	const helpText = getLocaleText(field.helpText, locale)
	const commonLabel = `${labelText}${field.required ? ' *' : ''}`
	const accept = buildAcceptFromFieldValidation(field)
	const maxFiles = getMaxFilesFromFieldValidation(field)

	return (
		<div className='space-y-2'>
			<Label>{commonLabel}</Label>
			<Dropzone
				accept={accept}
				className='min-h-44 justify-center'
				maxFiles={maxFiles}
				multiple={maxFiles > 1}
				src={value}
				onDrop={(files) => onChange(field.key, files)}
				onError={console.error}
			>
				<DropzoneEmptyState />
				<DropzoneContent />
			</Dropzone>
			{helpText && <p className='text-xs text-muted-foreground'>{helpText}</p>}
		</div>
	)
}
