'use client'

import { useEffect, useMemo, useState } from 'react'

import { cn } from '@lib'
import {
	Button,
	Checkbox,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { ArrowDownUp, ChevronsUpDown, ListFilter, RotateCcw, Search } from 'lucide-react'

import type { LessonListFilterOption, LessonListFiltersCardProps } from './lesson-list.types'

const SEARCH_DEBOUNCE_MS = 400

export function LessonListFiltersCard({
	allDisciplinesLabel,
	allGroupsLabel,
	allTypesLabel,
	className,
	disciplineOptions,
	disciplinePlaceholder,
	groupOptions,
	groupPlaceholder,
	lessonTypeLabel,
	lessonTypeOptions,
	onDisciplinesChange,
	onGroupsChange,
	onReset,
	onSearchChange,
	onSortChange,
	onTypesChange,
	resetLabel,
	searchDefaultValue,
	searchPlaceholder,
	selectedDisciplines,
	selectedGroups,
	selectedSort,
	selectedTypes,
	sortPlaceholder,
	sortNewestLabel,
	sortOldestLabel,
}: LessonListFiltersCardProps) {
	const [searchValue, setSearchValue] = useState(searchDefaultValue)
	const hasActiveFilters = Boolean(
		searchDefaultValue.trim() ||
		selectedTypes.length ||
		selectedDisciplines.length ||
		selectedGroups.length ||
		selectedSort !== 'desc',
	)

	useEffect(() => {
		setSearchValue(searchDefaultValue)
	}, [searchDefaultValue])

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			const nextSearch = searchValue.trim()
			if (nextSearch !== searchDefaultValue.trim()) {
				onSearchChange(nextSearch)
			}
		}, SEARCH_DEBOUNCE_MS)

		return () => window.clearTimeout(timeoutId)
	}, [onSearchChange, searchDefaultValue, searchValue])

	return (
		<div className={className}>
			<div className='flex h-full flex-col gap-4'>
				<div className='flex flex-col gap-3 xl:flex-row xl:items-end'>
					<div className='grid w-full items-end gap-3 md:grid-cols-2 xl:grid-cols-5'>
						<div className='md:col-span-2 xl:col-span-1'>
							<div className='relative'>
								<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
								<Input
									className='h-9 pl-9'
									name='q'
									placeholder={searchPlaceholder}
									value={searchValue}
									onChange={(event) => setSearchValue(event.target.value)}
								/>
							</div>
						</div>

						<MultiFilterPopover
							allLabel={allTypesLabel}
							options={lessonTypeOptions}
							placeholder={lessonTypeLabel}
							selectedValues={selectedTypes}
							onChange={onTypesChange}
						/>

						<MultiFilterPopover
							allLabel={allDisciplinesLabel}
							options={disciplineOptions}
							placeholder={disciplinePlaceholder}
							selectedValues={selectedDisciplines}
							onChange={onDisciplinesChange}
						/>

						<MultiFilterPopover
							allLabel={allGroupsLabel}
							options={groupOptions}
							placeholder={groupPlaceholder}
							selectedValues={selectedGroups}
							onChange={onGroupsChange}
						/>

						<Select value={selectedSort} onValueChange={(value) => onSortChange(value as 'asc' | 'desc')}>
							<SelectTrigger
								className='h-9 w-full justify-start gap-1.5 px-2 text-xs font-normal'
								title={sortPlaceholder}
							>
								<ArrowDownUp className='h-4 w-4 shrink-0' />
								<SelectValue placeholder={sortPlaceholder} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='desc'>{sortNewestLabel}</SelectItem>
								<SelectItem value='asc'>{sortOldestLabel}</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end xl:w-auto'>
						<Button
							className='h-9 w-full px-5 sm:w-auto'
							disabled={!hasActiveFilters}
							type='button'
							variant='outline'
							onClick={onReset}
						>
							<RotateCcw className='h-4 w-4' />
							{resetLabel}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

function MultiFilterPopover({
	allLabel,
	options,
	placeholder,
	selectedValues,
	onChange,
}: {
	allLabel: string
	options: LessonListFilterOption[]
	placeholder: string
	selectedValues: string[]
	onChange: (value: string[]) => void
}) {
	const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues])
	const hasSelectedValues = selectedValues.length > 0
	const selectedText = useMemo(() => {
		if (!hasSelectedValues) return allLabel
		if (selectedValues.length === 1) {
			return options.find((option) => option.value === selectedValues[0])?.label || selectedValues[0]
		}

		return `${placeholder}: ${selectedValues.length}`
	}, [allLabel, hasSelectedValues, options, placeholder, selectedValues])

	const toggleValue = (value: string) => {
		if (selectedSet.has(value)) {
			onChange(selectedValues.filter((item) => item !== value))
			return
		}

		onChange([...selectedValues, value])
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					aria-label={placeholder}
					className={cn(
						'h-9 w-full justify-start gap-2 px-3 text-xs font-normal',
						hasSelectedValues && 'text-primary',
					)}
					role='combobox'
					title={selectedText}
					type='button'
					variant='outline'
				>
					<ListFilter className='h-4 w-4 shrink-0' />
					<span className='min-w-0 flex-1 truncate text-left'>{selectedText}</span>
					<ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-64 p-2'>
				{options.length ? (
					<div className='max-h-72 space-y-2 overflow-y-auto pr-1'>
						{options.map((option) => (
							<label
								key={option.value}
								className='flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted'
							>
								<Checkbox
									checked={selectedSet.has(option.value)}
									onCheckedChange={() => toggleValue(option.value)}
								/>
								<span className='min-w-0 truncate'>{option.label}</span>
							</label>
						))}
					</div>
				) : (
					<p className='px-2 py-1.5 text-sm text-muted-foreground'>{allLabel}</p>
				)}
			</PopoverContent>
		</Popover>
	)
}
