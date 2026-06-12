'use client'

import { useMemo } from 'react'

import {
	Button,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@shadcn'
import { cn } from '@lib'
import { ArrowDownUp, Building2, Check, ChevronsUpDown, RotateCcw, Search, Users } from 'lucide-react'

import { type DepartmentOption, type FilteredUserType, type SortOrder, type RatingStatsTexts } from '../rating-stats.types'

interface IProps {
	departmentOptions: DepartmentOption[]
	hasActiveFilters: boolean
	onDepartmentToggle: (departmentId: string) => void
	onReset: () => void
	onSearchChange: (value: string) => void
	onSortChange: (value: SortOrder) => void
	onTypeToggle: (type: FilteredUserType) => void
	search: string
	selectedDepartmentIds: string[]
	selectedSort: SortOrder
	selectedTypes: FilteredUserType[]
	t: Pick<RatingStatsTexts, 'allDepartments' | 'allTypes' | 'departmentLabel' | 'resetFilters' | 'searchPlaceholder' | 'sortAsc' | 'sortDesc' | 'sortLabel' | 'typeLabel'>
	typeOptions: Array<{ label: string; value: FilteredUserType }>
}

export const RatingStatsFilters = ({
	departmentOptions,
	hasActiveFilters,
	onDepartmentToggle,
	onReset,
	onSearchChange,
	onSortChange,
	onTypeToggle,
	search,
	selectedDepartmentIds,
	selectedSort,
	selectedTypes,
	t,
	typeOptions,
}: IProps) => {
	const selectedTypeSet = useMemo(() => new Set(selectedTypes), [selectedTypes])
	const selectedDepartmentSet = useMemo(() => new Set(selectedDepartmentIds), [selectedDepartmentIds])

	const selectedTypesText = selectedTypes.length ? `${t.typeLabel} (${selectedTypes.length})` : t.allTypes
	const selectedDepartmentText = selectedDepartmentIds.length ? `${t.departmentLabel} (${selectedDepartmentIds.length})` : t.allDepartments

	const selectedTypeTitle = selectedTypes.length
		? typeOptions
				.filter((option) => selectedTypeSet.has(option.value))
				.map((option) => option.label)
				.join(', ')
		: t.allTypes

	const selectedDepartmentTitle = selectedDepartmentIds.length
		? selectedDepartmentIds
				.map((departmentId) => departmentOptions.find((item) => item.id === departmentId)?.label)
				.filter(Boolean)
				.join(', ')
		: t.allDepartments

	return (
		<div className='mb-2'>
			<div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
				<div className='flex flex-1 flex-wrap items-center gap-2'>
					<div className='relative'>
						<Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							className='h-8 w-full min-w-52 pl-9 text-xs sm:w-72'
							placeholder={t.searchPlaceholder}
							value={search}
							onChange={(event) => onSearchChange(event.target.value)}
						/>
					</div>

					<Popover>
						<PopoverTrigger asChild>
							<Button
								aria-label={t.typeLabel}
								className='h-8 min-w-36 justify-between gap-2 px-3 text-xs font-normal'
								role='combobox'
								title={selectedTypeTitle}
								type='button'
								variant='outline'
							>
								<Users className={cn('h-4 w-4 shrink-0', selectedTypes.length > 0 && 'text-primary')} />
								<span className={cn('truncate', selectedTypes.length > 0 ? 'text-primary' : 'text-foreground')}>
									{selectedTypesText}
								</span>
								<ChevronsUpDown className='ml-1 h-4 w-4 shrink-0 opacity-50' />
							</Button>
						</PopoverTrigger>
	<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-80 p-2'>
							<div className='flex flex-col gap-1'>
								{typeOptions.map((option) => (
									<button
										key={option.value}
										className={cn(
											'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60',
											selectedTypeSet.has(option.value) && 'bg-muted/80 text-primary',
										)}
										type='button'
										onClick={() => onTypeToggle(option.value)}
									>
										<Check
											className={cn(
												'h-3.5 w-3.5 shrink-0',
												selectedTypeSet.has(option.value) ? 'text-primary opacity-100' : 'opacity-0',
											)}
										/>
										<Users
											className={cn('h-3.5 w-3.5 shrink-0', selectedTypeSet.has(option.value) && 'text-primary')}
										/>
										<span className='truncate'>{option.label}</span>
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>

					<Popover>
						<PopoverTrigger asChild>
							<Button
								aria-label={t.departmentLabel}
								className='h-8 min-w-44 justify-between gap-2 px-3 text-xs font-normal'
								role='combobox'
								title={selectedDepartmentTitle}
								type='button'
								variant='outline'
							>
								<Building2
									className={cn('h-4 w-4 shrink-0', selectedDepartmentIds.length > 0 && 'text-primary')}
								/>
								<span
									className={cn(
										'truncate',
										selectedDepartmentIds.length > 0 ? 'text-primary' : 'text-foreground',
									)}
								>
									{selectedDepartmentText}
								</span>
								<ChevronsUpDown className='ml-1 h-4 w-4 shrink-0 opacity-50' />
							</Button>
						</PopoverTrigger>
						<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-96 p-2'>
							<div className='max-h-80 flex flex-col gap-1 overflow-auto pr-1'>
								{departmentOptions.map((department) => (
									<button
										key={department.id}
										className={cn(
											'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60',
											selectedDepartmentSet.has(department.id) && 'bg-muted/80 text-primary',
										)}
										type='button'
										onClick={() => onDepartmentToggle(department.id)}
									>
										<Check
											className={cn(
												'h-3.5 w-3.5 shrink-0',
												selectedDepartmentSet.has(department.id) ? 'text-primary opacity-100' : 'opacity-0',
											)}
										/>
										<Building2
											className={cn('h-3.5 w-3.5 shrink-0', selectedDepartmentSet.has(department.id) && 'text-primary')}
										/>
										<span className='truncate'>{department.label}</span>
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>

					<Select value={selectedSort} onValueChange={(value) => onSortChange(value as SortOrder)}>
						<SelectTrigger
							aria-label={t.sortLabel}
							className='h-8 min-w-40 justify-start gap-1.5 px-2 text-xs font-normal'
							size='sm'
							title={selectedSort === 'asc' ? t.sortAsc : t.sortDesc}
						>
							<ArrowDownUp className='h-4 w-4 shrink-0 text-muted-foreground' />
							<SelectValue className='truncate text-left' placeholder={t.sortLabel} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='desc'>{t.sortDesc}</SelectItem>
							<SelectItem value='asc'>{t.sortAsc}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							aria-label={t.resetFilters}
							className='h-8 w-8 shrink-0 p-0'
							disabled={!hasActiveFilters}
							type='button'
							variant='outline'
							onClick={onReset}
						>
							<RotateCcw className='h-4 w-4' />
						</Button>
					</TooltipTrigger>
					<TooltipContent side='top' sideOffset={8}>
						<p className='text-xs'>{t.resetFilters}</p>
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	)
}
