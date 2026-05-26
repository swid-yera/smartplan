'use client'

import { getLocaleText } from '@helpers'
import { Dropzone, DropzoneContent, DropzoneEmptyState, Label } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ICategoryFieldResponse } from '@types'

import localeDictionary from './locale.json'

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

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const mergeFiles = (currentFiles: File[], nextFiles: File[], maxFiles: number) => {
	const filesByKey = new Map<string, File>()

	;[...currentFiles, ...nextFiles].forEach((file) => {
		const fileKey = `${file.name}-${file.size}-${file.lastModified}`

		if (!filesByKey.has(fileKey)) {
			filesByKey.set(fileKey, file)
		}
	})

	return Array.from(filesByKey.values()).slice(0, maxFiles)
}

export const CategoryFileFieldInput = ({ field, value, onChange }: CategoryFileFieldInputProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const labelText = getLocaleText(field.label, locale)
	const helpText = getLocaleText(field.helpText, locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const commonLabel = `${labelText}${field.required ? ' *' : ''}`
	const accept = buildAcceptFromFieldValidation(field)
	const maxFiles = getMaxFilesFromFieldValidation(field)
	const srcFiles = value.length > 0 ? value : undefined

	const handleRemoveFile = (indexToRemove: number) => {
		onChange(
			field.key,
			value.filter((_, index) => index !== indexToRemove),
		)
	}

	return (
		<div className='space-y-2'>
			<Label>{commonLabel}</Label>
			<Dropzone
				accept={accept}
				className='min-h-44 justify-center'
				maxFiles={maxFiles}
				multiple={maxFiles > 1}
				src={srcFiles}
				onDrop={(files) => onChange(field.key, mergeFiles(value, files, maxFiles))}
				onError={console.error}
			>
				<DropzoneEmptyState />
				<DropzoneContent>
					<div className='w-full text-left space-y-2'>
						<p className='text-sm font-medium'>
							{t.fileSelected}: {value.length}
						</p>
						<ul className='space-y-2'>
							{value.map((file, index) => (
								<li key={`${file.name}-${file.size}-${file.lastModified}`} className='rounded-md border p-2 text-xs'>
									<div className='flex items-start justify-between gap-2'>
										<div className='min-w-0'>
											<p className='truncate font-medium'>{file.name}</p>
											<p className='text-muted-foreground'>{formatFileSize(file.size)}</p>
										</div>
										<span
											aria-label={`${t.fileRemove}: ${file.name}`}
											className='text-destructive underline cursor-pointer shrink-0'
											role='button'
											tabIndex={0}
											onClick={(event) => {
												event.preventDefault()
												event.stopPropagation()
												handleRemoveFile(index)
											}}
											onKeyDown={(event) => {
												if (event.key !== 'Enter' && event.key !== ' ') return

												event.preventDefault()
												event.stopPropagation()
												handleRemoveFile(index)
											}}
										>
											{t.fileRemove}
										</span>
									</div>
								</li>
							))}
						</ul>
						<p className='text-xs text-muted-foreground'>{t.fileDropHint}</p>
					</div>
				</DropzoneContent>
			</Dropzone>
			{helpText && <p className='text-xs text-muted-foreground'>{helpText}</p>}
		</div>
	)
}
