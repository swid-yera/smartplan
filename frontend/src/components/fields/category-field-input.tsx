'use client'

import { useMemo, useState } from 'react'

import { formatCourseFromYearAndGroupName, getLocaleText } from '@helpers'
import { services } from '@services'
import {
	Badge,
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
import { Check, ChevronDown, ChevronsUpDown, X } from 'lucide-react'

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

const getCurrentAcademicYear = () => {
	const now = new Date()
	const currentYear = now.getFullYear()
	const academicYearStart = now.getMonth() >= 8 ? currentYear : currentYear - 1

	return `${academicYearStart}-${academicYearStart + 1}`
}

const normalizeGroupFieldValue = (value: ICategoryFieldValue | undefined) => {
	if (Array.isArray(value)) {
		return value
			.filter((item): item is string => typeof item === 'string')
			.map((item) => item.trim())
			.filter(Boolean)
	}

	if (typeof value === 'string') {
		const trimmedValue = value.trim()

		return trimmedValue ? [trimmedValue] : []
	}

	return []
}

const getGroupCourse = (groupName: string) => {
	const course = formatCourseFromYearAndGroupName(groupName, getCurrentAcademicYear())

	return typeof course === 'number' ? course : null
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
	const selectedGroups = useMemo(() => normalizeGroupFieldValue(value), [value])
	const selectedGroupSet = useMemo(() => new Set(selectedGroups), [selectedGroups])
	const groupsByCourse = useMemo(() => {
		const sections = new Map<number, typeof groupsData>()
		const uncategorizedGroups: typeof groupsData = []

		for (const group of groupsData) {
			const course = getGroupCourse(group.name)

			if (course === null) {
				uncategorizedGroups.push(group)
				continue
			}

			const courseGroups = sections.get(course) || []

			courseGroups.push(group)
			sections.set(course, courseGroups)
		}

		const orderedSections = Array.from(sections.entries())
			.sort(([leftCourse], [rightCourse]) => leftCourse - rightCourse)
			.map(([course, courseGroups]) => ({
				course,
				groups: courseGroups.sort((left, right) => left.name.localeCompare(right.name, locale)),
			}))

		const hasUncategorizedGroups = uncategorizedGroups.length > 0

		return {
			orderedSections,
			uncategorizedGroups: hasUncategorizedGroups
				? uncategorizedGroups.sort((left, right) => left.name.localeCompare(right.name, locale))
				: [],
		}
	}, [groupsData, locale])

	const selectedGroupLabels = useMemo(() => {
		const groupByName = new Map(groupsData.map((group) => [group.name, group]))

		return selectedGroups.map((groupName) => groupByName.get(groupName)?.name || groupName)
	}, [groupsData, selectedGroups])
	const isAllGroupsSelected = groupsData.length > 0 && selectedGroups.length === groupsData.length
	const selectedSummary = useMemo(() => {
		if (!selectedGroups.length) return ''

		if (isAllGroupsSelected) {
			return t.allCourses
		}

		const selectedSet = new Set(selectedGroups)
		const exactCourseSection = groupsByCourse.orderedSections.find(({ groups }) => {
			return (
				groups.length > 0 &&
				groups.every((group) => selectedSet.has(group.name)) &&
				groups.length === selectedGroups.length
			)
		})

		if (exactCourseSection) {
			return t.courseFull.replace('{course}', String(exactCourseSection.course))
		}

		if (selectedGroups.length === 1) {
			return selectedGroupLabels[0] || selectedGroups[0] || ''
		}

		return t.selectedCount.replace('{count}', String(selectedGroups.length))
	}, [
		groupsByCourse.orderedSections,
		isAllGroupsSelected,
		selectedGroupLabels,
		selectedGroups,
		t.allCourses,
		t.courseFull,
		t.selectedCount,
	])

	const updateGroupSelection = (nextSelection: string[]) => {
		const uniqueSelection = Array.from(new Set(nextSelection))
		const orderedSelection = groupsData
			.map((group) => group.name)
			.filter((groupName) => uniqueSelection.includes(groupName))
			.concat(uniqueSelection.filter((groupName) => !groupsData.some((group) => group.name === groupName)))

		onChange(field.key, orderedSelection)
	}

	const toggleGroupSelection = (groupName: string) => {
		const nextSelection = selectedGroups.includes(groupName)
			? selectedGroups.filter((item) => item !== groupName)
			: [...selectedGroups, groupName]

		updateGroupSelection(nextSelection)
	}

	const toggleCourseSelection = (course: number) => {
		const courseGroupNames =
			groupsByCourse.orderedSections
				.find((section) => section.course === course)
				?.groups.map((group) => group.name) || []

		if (!courseGroupNames.length) return

		const courseSet = new Set(courseGroupNames)
		const isCourseFullySelected = courseGroupNames.every((groupName) => selectedGroupSet.has(groupName))

		const nextSelection = isCourseFullySelected
			? selectedGroups.filter((groupName) => !courseSet.has(groupName))
			: [...selectedGroups, ...courseGroupNames.filter((groupName) => !selectedGroupSet.has(groupName))]

		updateGroupSelection(nextSelection)
	}

	const toggleAllGroupsSelection = () => {
		updateGroupSelection(isAllGroupsSelected ? [] : groupsData.map((group) => group.name))
	}

	const clearGroupSelection = () => {
		updateGroupSelection([])
	}

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
		const displayValue = selectedGroups.length
			? selectedSummary
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
							disabled={isGroupsLoading}
							id={field.key}
							role='combobox'
							variant='outline'
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
								<CommandGroup heading={t.allCourses}>
									<CommandItem value={t.allCourses} onSelect={toggleAllGroupsSelection}>
										<Check
											className={isAllGroupsSelected ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'}
										/>
										{t.allCourses}
									</CommandItem>
									{selectedGroups.length > 0 ? (
										<CommandItem value={t.clearSelection} onSelect={clearGroupSelection}>
											<X className='mr-2 h-4 w-4' />
											{t.clearSelection}
										</CommandItem>
									) : null}
								</CommandGroup>
								{groupsByCourse.orderedSections.map(({ course, groups }) => {
									const courseGroupNames = groups.map((group) => group.name)
									const isCourseFullySelected =
										courseGroupNames.length > 0 &&
										courseGroupNames.every((groupName) => selectedGroupSet.has(groupName))

									return (
										<CommandGroup key={course} heading={t.courseFull.replace('{course}', String(course))}>
											<CommandItem
												value={`${t.courseFull.replace('{course}', String(course))} ${t.allCourses}`}
												onSelect={() => toggleCourseSelection(course)}
											>
												<Check
													className={
														isCourseFullySelected ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'
													}
												/>
												{t.courseFull.replace('{course}', String(course))}
											</CommandItem>
											{groups.map((group) => {
												const isSelected = selectedGroupSet.has(group.name)

												return (
													<CommandItem
														key={group.keycloakId}
														value={group.name}
														onSelect={() => toggleGroupSelection(group.name)}
													>
														<Check
															className={
																isSelected ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'
															}
														/>
														<div className='flex w-full items-center justify-between gap-2'>
															<span className='truncate'>{group.name}</span>
															<span className='shrink-0 text-xs text-muted-foreground'>
																{t.courseShort.replace('{course}', String(course))}
															</span>
														</div>
													</CommandItem>
												)
											})}
										</CommandGroup>
									)
								})}
								{groupsByCourse.uncategorizedGroups.length > 0 ? (
									<CommandGroup heading={t.noCourse}>
										{groupsByCourse.uncategorizedGroups.map((group) => {
											const isSelected = selectedGroupSet.has(group.name)

											return (
												<CommandItem
													key={group.keycloakId}
													value={group.name}
													onSelect={() => toggleGroupSelection(group.name)}
												>
													<Check
														className={isSelected ? 'mr-2 h-4 w-4 opacity-100' : 'mr-2 h-4 w-4 opacity-0'}
													/>
													{group.name}
												</CommandItem>
											)
										})}
									</CommandGroup>
								) : null}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{selectedGroups.length > 0 ? (
					<div className='flex flex-wrap gap-2'>
						{selectedGroupLabels.map((groupName) => (
							<Badge key={groupName} className='gap-1' variant='secondary'>
								<span className='max-w-48 truncate'>{groupName}</span>
								<button
									aria-label={`${t.clearSelection}: ${groupName}`}
									className='rounded-sm p-0.5 hover:bg-black/10'
									type='button'
									onClick={() => toggleGroupSelection(groupName)}
								>
									<X className='h-3 w-3' />
								</button>
							</Badge>
						))}
					</div>
				) : null}
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
