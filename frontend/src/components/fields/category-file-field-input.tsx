'use client'

import { Dropzone, DropzoneContent, DropzoneEmptyState, Label } from '@shadcn'
import type { ICategoryFieldResponse } from '@types'

type CategoryFileFieldInputProps = {
	field: ICategoryFieldResponse
	value: File[]
	onChange: (fieldKey: string, files: File[]) => void
}

export const CategoryFileFieldInput = ({ field, value, onChange }: CategoryFileFieldInputProps) => {
	const commonLabel = `${field.label}${field.required ? ' *' : ''}`

	return (
		<div className='space-y-2'>
			<Label>{commonLabel}</Label>
			<Dropzone
				accept={{
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
				}}
				className='min-h-44 justify-center'
				maxFiles={1}
				src={value}
				onDrop={(files) => onChange(field.key, files)}
				onError={console.error}
			>
				<DropzoneEmptyState />
				<DropzoneContent />
			</Dropzone>
			{field.helpText && <p className='text-xs text-muted-foreground'>{field.helpText}</p>}
		</div>
	)
}
