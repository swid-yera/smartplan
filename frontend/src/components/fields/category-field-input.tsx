'use client'

import { useState } from 'react'

import { getLocaleText } from '@helpers'
import { services } from '@services'
import {
	Button,
	Calendar,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
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
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { CategoryFieldType, ICategoryFieldResponse } from '@types'
import { format } from 'date-fns'
import { Check, ChevronDown, ChevronsUpDown } from 'lucide-react'

import {
	type ICategoryFieldValue,
	capitalizeFirstLetter,
	getCategoryFieldValidationError,
	isFileFieldValueArray,
	isFutureDate,
	normalizeUrlWithoutProtocol,
	parseDateFromFieldValue,
} from './category-fields.utils'
import { CategoryFileFieldInput } from './category-file-field-input'
import localeDictionary from './locale.json'

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
	const locale = useLocaleStore((state) => state.locale)
	const labelText = capitalizeFirstLetter(getLocaleText(field.label, locale))
	const placeholderText = getLocaleText(field.placeholder, locale)
	const helpText = getLocaleText(field.helpText, locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const commonLabel = `${labelText}${field.required ? ' *' : ''}`
	const validationError = getCategoryFieldValidationError(field, value, locale)
	const [groupOpen, setGroupOpen] = useState(false)
	const { data: groupsData = [], isLoading: isGroupsLoading } = useQuery({
		...services.group.getAllOptions(),
		enabled: field.type === 'group',
	})

	if (field.type === 'multi_fields') {
		return null
	}

	if (field.type === 'textarea') {
		return (
			<div className='space-y-2'>
				<Label htmlFor={field.key}>{commonLabel}</Label>
				<Textarea
					id={field.key}
					maxLength={typeof field.validation?.maxLength === 'number' ? field.validation.maxLength : undefined}
					minLength={typeof field.validation?.minLength === 'number' ? field.validation.minLength : undefined}
					placeholder={placeholderText}
					value={typeof value === 'string' ? value : ''}
					onChange={(event) => onChange(field.key, event.target.value)}
				/>
				{validationError && <p className='text-xs text-destructive'>{validationError}</p>}
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
						<SelectTrigger className='w-full' id={field.key}>
							<SelectValue placeholder={placeholderText || t.selectPlaceholder} />
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

	if (field.type === 'group') {
		const selectedGroup = typeof value === 'string' ? groupsData.find((group) => group.name === value) : undefined
		const hasValue = typeof value === 'string' && value.trim().length > 0
		const displayValue = hasValue
			? groupsData.length > 0
				? selectedGroup?.name || t.groupNotFound
				: value
			: isGroupsLoading
				? t.groupLoading
				: placeholderText || t.groupPlaceholder

		return (
			<div className='space-y-2'>
				<Label htmlFor={field.key}>{commonLabel}</Label>
				<Popover open={groupOpen} onOpenChange={setGroupOpen}>
					<PopoverTrigger asChild>
						<Button
							className='w-full justify-between font-normal'
							id={field.key}
							role='combobox'
							variant='outline'
							disabled={isGroupsLoading}
						>
							<span className='truncate'>{displayValue}</span>
							<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
						</Button>
					</PopoverTrigger>
					<PopoverContent align='center' className='w-[--radix-popover-trigger-width] p-0'>
						<Command>
							<CommandInput placeholder={t.groupSearch} />
							<CommandList>
								<CommandEmpty>{t.groupNotFoundCommand}</CommandEmpty>
								<CommandGroup>
									{groupsData.map((group) => (
										<CommandItem
											key={group.keycloakId}
											value={group.name}
											onSelect={() => {
												onChange(field.key, group.name)
												setGroupOpen(false)
											}}
										>
											<Check
												className={
													selectedGroup?.keycloakId === group.keycloakId
														? 'mr-2 h-4 w-4 opacity-100'
														: 'mr-2 h-4 w-4 opacity-0'
												}
											/>
											{group.name}
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{helpText && <p className='text-xs text-muted-foreground'>{helpText}</p>}
			</div>
		)
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
						placeholder={placeholderText || t.urlPlaceholder}
						type='text'
						value={typeof value === 'string' ? value : ''}
						onChange={(event) => onChange(field.key, normalizeUrlWithoutProtocol(event.target.value))}
					/>
				</div>
				{validationError && <p className='text-xs text-destructive'>{validationError}</p>}
				{helpText && <p className='text-xs text-muted-foreground'>{helpText}</p>}
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
							{selectedDate ? format(selectedDate, 'dd.MM.yyyy') : placeholderText || t.datePlaceholder}
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
				{validationError && <p className='text-xs text-destructive'>{validationError}</p>}
				{helpText && <p className='text-xs text-muted-foreground'>{helpText}</p>}
			</div>
		)
	}

	if (field.type === 'file') {
		return (
			<CategoryFileFieldInput
				field={field}
				value={isFileFieldValueArray(value) ? value : []}
				onChange={(fieldKey, files) => onChange(fieldKey, files)}
			/>
		)
	}

	const inputTypeByFieldType: Record<Exclude<CategoryFieldType, 'multi_fields' | 'group'>, string> = {
		text: 'text',
		textarea: 'text',
		number: 'number',
		select: 'text',
		date: 'date',
		file: 'text',
		url: 'url',
	}

	return (
		<div className='space-y-2'>
			<Label htmlFor={field.key}>{commonLabel}</Label>
			<Input
				id={field.key}
				max={
					field.type === 'number' && typeof field.validation?.max === 'number' ? field.validation.max : undefined
				}
				maxLength={
					field.type === 'text' && typeof field.validation?.maxLength === 'number'
						? field.validation.maxLength
						: undefined
				}
				min={
					field.type === 'number' && typeof field.validation?.min === 'number' ? field.validation.min : undefined
				}
				minLength={
					field.type === 'text' && typeof field.validation?.minLength === 'number'
						? field.validation.minLength
						: undefined
				}
				placeholder={placeholderText}
				type={inputTypeByFieldType[field.type]}
				value={typeof value === 'string' ? value : ''}
				onChange={(event) => onChange(field.key, event.target.value)}
			/>
			{validationError && <p className='text-xs text-destructive'>{validationError}</p>}
			{helpText && <p className='text-xs text-muted-foreground'>{helpText}</p>}
		</div>
	)
}
