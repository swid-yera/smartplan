'use client'

import {
	Button,
	Calendar,
	Checkbox,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@shadcn'
import type { CategoryFieldType, ICategoryFieldResponse } from '@types'
import { format } from 'date-fns'
import { ChevronDown } from 'lucide-react'

import {
	type ICategoryFieldValue,
	isFutureDate,
	normalizeUrlWithoutProtocol,
	parseDateFromFieldValue,
} from './category-fields.utils'
import { CategoryFileFieldInput } from './category-file-field-input'

const parseSelectOptions = (options: unknown): { label: string; value: string }[] => {
	if (!Array.isArray(options)) return []

	return options
		.map((option) => {
			if (typeof option === 'string') return { label: option, value: option }
			if (typeof option === 'number') return { label: String(option), value: String(option) }
			if (typeof option === 'object' && option !== null) {
				const optionValue = 'value' in option ? String(option.value) : ''
				const optionLabel =
					'label' in option && typeof option.label === 'string'
						? option.label
						: optionValue || ('name' in option ? String(option.name) : '')

				if (!optionLabel && !optionValue) return null

				return { label: optionLabel || optionValue, value: optionValue || optionLabel }
			}

			return null
		})
		.filter((option): option is { label: string; value: string } => !!option)
}

type CategoryFieldInputProps = {
	field: ICategoryFieldResponse
	value: ICategoryFieldValue | undefined
	onChange: (fieldKey: string, nextValue: ICategoryFieldValue) => void
}

export const CategoryFieldInput = ({ field, value, onChange }: CategoryFieldInputProps) => {
	const commonLabel = `${field.label}${field.required ? ' *' : ''}`

	if (field.type === 'textarea') {
		return (
			<div className='space-y-2'>
				<Label htmlFor={field.key}>{commonLabel}</Label>
				<Textarea
					id={field.key}
					placeholder={field.placeholder || ''}
					value={typeof value === 'string' ? value : ''}
					onChange={(event) => onChange(field.key, event.target.value)}
				/>
			</div>
		)
	}

	if (field.type === 'checkbox') {
		return (
			<div className='flex items-center justify-between rounded-md border p-3'>
				<div>
					<p className='text-sm font-medium'>{commonLabel}</p>
					{field.helpText && <p className='text-xs text-muted-foreground'>{field.helpText}</p>}
				</div>
				<Checkbox checked={value === true} onCheckedChange={(checked) => onChange(field.key, checked === true)} />
			</div>
		)
	}

	if (field.type === 'select') {
		const options = parseSelectOptions(field.options)

		if (options.length) {
			return (
				<div className='space-y-2'>
					<Label htmlFor={field.key}>{commonLabel}</Label>
					<Select
						value={typeof value === 'string' ? value : ''}
						onValueChange={(nextValue) => onChange(field.key, nextValue)}
					>
						<SelectTrigger id={field.key}>
							<SelectValue placeholder={field.placeholder || 'Выберите значение'} />
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)
		}
	}

	if (field.type === 'url') {
		return (
			<div className='space-y-2'>
				<Label htmlFor={field.key}>{commonLabel}</Label>
				<div className='flex items-center rounded-md border bg-background'>
					<span className='px-3 text-sm text-muted-foreground'>https://</span>
					<Input
						className='border-0 shadow-none focus-visible:ring-0'
						id={field.key}
						inputMode='url'
						placeholder={field.placeholder || 'example.com/path'}
						type='text'
						value={typeof value === 'string' ? value : ''}
						onChange={(event) => onChange(field.key, normalizeUrlWithoutProtocol(event.target.value))}
					/>
				</div>
				{field.helpText && <p className='text-xs text-muted-foreground'>{field.helpText}</p>}
			</div>
		)
	}

	if (field.type === 'date') {
		const selectedDate = parseDateFromFieldValue(value)

		return (
			<div className='space-y-2'>
				<Label htmlFor={field.key}>{commonLabel}</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button className='w-full justify-between font-normal' id={field.key} variant='outline'>
							{selectedDate ? format(selectedDate, 'dd.MM.yyyy') : field.placeholder || 'Выберите дату'}
							<ChevronDown />
						</Button>
					</PopoverTrigger>
					<PopoverContent align='start' className='w-auto overflow-hidden p-0'>
						<Calendar
							captionLayout='dropdown'
							disabled={(date) => isFutureDate(date)}
							mode='single'
							selected={selectedDate || undefined}
							onSelect={(nextDate) => {
								if (!nextDate) {
									onChange(field.key, '')

									return
								}

								onChange(field.key, format(nextDate, 'yyyy-MM-dd'))
							}}
						/>
					</PopoverContent>
				</Popover>
				{field.helpText && <p className='text-xs text-muted-foreground'>{field.helpText}</p>}
			</div>
		)
	}

	if (field.type === 'file') {
		return (
			<CategoryFileFieldInput
				field={field}
				value={Array.isArray(value) ? value : []}
				onChange={(fieldKey, files) => onChange(fieldKey, files)}
			/>
		)
	}

	const inputTypeByFieldType: Record<CategoryFieldType, string> = {
		text: 'text',
		textarea: 'text',
		number: 'number',
		select: 'text',
		date: 'date',
		file: 'text',
		url: 'url',
		checkbox: 'text',
	}

	return (
		<div className='space-y-2'>
			<Label htmlFor={field.key}>{commonLabel}</Label>
			<Input
				id={field.key}
				placeholder={field.placeholder || ''}
				type={inputTypeByFieldType[field.type]}
				value={typeof value === 'string' ? value : ''}
				onChange={(event) => onChange(field.key, event.target.value)}
			/>
			{field.helpText && <p className='text-xs text-muted-foreground'>{field.helpText}</p>}
		</div>
	)
}
