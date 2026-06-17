'use client'

import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { StatusBadge } from '@components'
import { getLocaleText, getStatusLabels } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
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
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { StatusEnum } from '@types'
import { ArrowDownUp, Building2, ChevronsUpDown, FolderTree, ListFilter, RotateCcw } from 'lucide-react'

import localeDictionary from './locale.json'
import {
	DEFAULT_RUP_SORT,
	buildRupFilterSearchParams,
	clearPersistedRupFilterState,
	getRupFilterStateFromSearchParams,
	persistRupFilterState,
} from './rups-filter-state'

interface IProps {
	className?: string
	compact?: boolean
	paramPrefix?: string
	persistKey?: string
}

type FilterOption = {
	id: string
	label: string
}

export const RupsFilterCard: FC<IProps> = ({ className, compact = true, paramPrefix, persistKey }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const labels = getStatusLabels(locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const searchParamsString = searchParams.toString()
	const storageKey = persistKey || undefined

	const initialState = getRupFilterStateFromSearchParams(new URLSearchParams(searchParamsString), { paramPrefix })
	const [searchValue, setSearchValue] = useState(initialState.search)
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialState.statuses)
	const [selectedDepartments, setSelectedDepartments] = useState<string[]>(initialState.departments)
	const [selectedGroups, setSelectedGroups] = useState<string[]>(initialState.groups)
	const [selectedSort, setSelectedSort] = useState<'asc' | 'desc'>(initialState.sort)
	const didMountRef = useRef(false)

	const { data: departmentRows = [] } = useQuery({
		...services.department.getAllOptions(),
		retry: false,
	})
	const { data: groupRows = [] } = useQuery({
		...services.group.getAllOptions(),
		retry: false,
	})

	const departmentOptions = useMemo<FilterOption[]>(
		() =>
			departmentRows
				.map((department) => ({
					id: department.keycloakId,
					label: getLocaleText(department.name, locale).trim(),
				}))
				.filter((item) => item.label)
				.sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' })),
		[departmentRows, locale],
	)
	const groupOptions = useMemo<FilterOption[]>(
		() =>
			groupRows
				.map((group) => ({
					id: group.keycloakId,
					label: group.name.trim(),
				}))
				.filter((item) => item.label)
				.sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' })),
		[groupRows, locale],
	)

	const selectedStatusesText = t.rupsFilter.statusesSelected.replace('{count}', String(selectedStatuses.length))
	const selectedDepartmentsText = t.rupsFilter.departmentsSelected.replace(
		'{count}',
		String(selectedDepartments.length),
	)
	const selectedGroupsText = t.rupsFilter.groupsSelected.replace('{count}', String(selectedGroups.length))
	const selectedSortLabel = selectedSort === 'asc' ? t.rupsFilter.sortAsc : t.rupsFilter.sortDesc
	const hasSelectedStatuses = selectedStatuses.length > 0
	const hasSelectedDepartments = selectedDepartments.length > 0
	const hasSelectedGroups = selectedGroups.length > 0
	const hasActiveFilters = Boolean(
		searchValue.trim() ||
			selectedStatuses.length > 0 ||
			selectedDepartments.length > 0 ||
			selectedGroups.length > 0 ||
			selectedSort !== DEFAULT_RUP_SORT,
	)

	useEffect(() => {
		const nextState = getRupFilterStateFromSearchParams(new URLSearchParams(searchParamsString), { paramPrefix })

		setSearchValue((prev) => (prev === nextState.search ? prev : nextState.search))
		setSelectedStatuses((prev) => {
			if (
				prev.length === nextState.statuses.length &&
				prev.every((value, index) => value === nextState.statuses[index])
			) {
				return prev
			}

			return nextState.statuses
		})
		setSelectedDepartments((prev) => {
			if (
				prev.length === nextState.departments.length &&
				prev.every((value, index) => value === nextState.departments[index])
			) {
				return prev
			}

			return nextState.departments
		})
		setSelectedGroups((prev) => {
			if (prev.length === nextState.groups.length && prev.every((value, index) => value === nextState.groups[index])) {
				return prev
			}

			return nextState.groups
		})
		setSelectedSort((prev) => (prev === nextState.sort ? prev : nextState.sort))
	}, [paramPrefix, searchParamsString])

	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) =>
			prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status],
		)
	}

	const toggleDepartment = (departmentId: string) => {
		setSelectedDepartments((prev) =>
			prev.includes(departmentId) ? prev.filter((item) => item !== departmentId) : [...prev, departmentId],
		)
	}

	const toggleGroup = (groupId: string) => {
		setSelectedGroups((prev) => (prev.includes(groupId) ? prev.filter((item) => item !== groupId) : [...prev, groupId]))
	}

	const applyFilters = useCallback(() => {
		const currentQuery = searchParams.toString()
		const params = buildRupFilterSearchParams(
			new URLSearchParams(currentQuery),
			{
				search: searchValue,
				statuses: selectedStatuses,
				departments: selectedDepartments,
				groups: selectedGroups,
				sort: selectedSort,
			},
			{ resetPage: true, paramPrefix },
		)
		const nextQuery = params.toString()

		persistRupFilterState(
			{
				search: searchValue,
				statuses: selectedStatuses,
				departments: selectedDepartments,
				groups: selectedGroups,
				sort: selectedSort,
			},
			storageKey,
		)

		if (nextQuery === currentQuery) return

		router.replace(`${pathname}?${nextQuery}`, { scroll: false })
	}, [
		paramPrefix,
		pathname,
		router,
		searchParams,
		searchValue,
		selectedDepartments,
		selectedGroups,
		selectedSort,
		selectedStatuses,
		storageKey,
	])

	useEffect(() => {
		if (!didMountRef.current) {
			didMountRef.current = true

			return
		}

		applyFilters()
	}, [applyFilters, searchValue, selectedDepartments, selectedGroups, selectedSort, selectedStatuses])

	const resetFilters = useCallback(() => {
		const defaults = {
			search: '',
			statuses: [] as string[],
			departments: [] as string[],
			groups: [] as string[],
			sort: DEFAULT_RUP_SORT,
		}
		const params = buildRupFilterSearchParams(new URLSearchParams(searchParams.toString()), defaults, {
			resetPage: true,
			paramPrefix,
		})

		clearPersistedRupFilterState(storageKey)
		setSearchValue(defaults.search)
		setSelectedStatuses(defaults.statuses)
		setSelectedDepartments(defaults.departments)
		setSelectedGroups(defaults.groups)
		setSelectedSort(defaults.sort)

		router.replace(`${pathname}?${params.toString()}`, { scroll: false })
	}, [paramPrefix, pathname, router, searchParams, storageKey])

	if (compact) {
		return (
			<div className={cn('flex flex-col gap-2', className)}>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between'>
						<div className='flex flex-1 flex-wrap items-center gap-2'>
							<div className='space-y-1'>
								<Label className='sr-only'>{t.rupsFilter.search}</Label>
								<Input
									className='h-8 w-full min-w-52 text-xs sm:w-72'
									name='q'
									placeholder={t.rupsFilter.searchPlaceholder}
									value={searchValue}
									onChange={(event) => setSearchValue(event.target.value)}
								/>
							</div>

							<div className='space-y-1'>
								<Label className='sr-only'>{t.rupsFilter.status}</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											aria-label={t.rupsFilter.status}
											className='h-8 min-w-36 justify-start gap-2 px-3 text-xs font-normal'
											role='combobox'
											title={hasSelectedStatuses ? selectedStatusesText : t.rupsFilter.status}
											type='button'
											variant='outline'
										>
											<ListFilter
												className={cn('h-4 w-4 shrink-0', hasSelectedStatuses && 'text-primary')}
											/>
											<span
												className={cn('truncate', hasSelectedStatuses ? 'text-primary' : 'text-foreground')}
											>
												{hasSelectedStatuses ? selectedStatusesText : t.rupsFilter.status}
											</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-80 p-2'>
										<div className='max-h-72 space-y-2 overflow-y-auto'>
											{Object.entries(labels).map(([status]) => (
												<div key={status} className='flex items-center gap-2'>
													<Checkbox
														checked={selectedStatuses.includes(status)}
														id={status}
														onCheckedChange={() => toggleStatus(status)}
													/>
													<label className='cursor-pointer select-none' htmlFor={status}>
														<StatusBadge status={status as StatusEnum} />
													</label>
												</div>
											))}
										</div>
									</PopoverContent>
								</Popover>
							</div>

							<div className='space-y-1'>
								<Label className='sr-only'>{t.rupsFilter.departments}</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											aria-label={t.rupsFilter.departments}
											className='h-8 min-w-40 justify-start gap-2 px-3 text-xs font-normal'
											role='combobox'
											title={hasSelectedDepartments ? selectedDepartmentsText : t.rupsFilter.departments}
											type='button'
											variant='outline'
										>
											<Building2
												className={cn('h-4 w-4 shrink-0', hasSelectedDepartments && 'text-primary')}
											/>
											<span
												className={cn('truncate', hasSelectedDepartments ? 'text-primary' : 'text-foreground')}
											>
												{hasSelectedDepartments ? selectedDepartmentsText : t.rupsFilter.departments}
											</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-80 p-2'>
										<div className='max-h-72 space-y-2 overflow-y-auto'>
											{departmentOptions.length > 0 ? (
												departmentOptions.map((department) => (
													<div key={department.id} className='flex items-center gap-2'>
														<Checkbox
															checked={selectedDepartments.includes(department.id)}
															id={`department-${department.id}`}
															onCheckedChange={() => toggleDepartment(department.id)}
														/>
														<label className='cursor-pointer select-none' htmlFor={`department-${department.id}`}>
															{department.label}
														</label>
													</div>
												))
											) : (
												<p className='px-1 py-2 text-sm text-muted-foreground'>
													{t.rupsFilter.noDepartments}
												</p>
											)}
										</div>
									</PopoverContent>
								</Popover>
							</div>

							<div className='space-y-1'>
								<Label className='sr-only'>{t.rupsFilter.groups}</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											aria-label={t.rupsFilter.groups}
											className='h-8 min-w-40 justify-start gap-2 px-3 text-xs font-normal'
											role='combobox'
											title={hasSelectedGroups ? selectedGroupsText : t.rupsFilter.groups}
											type='button'
											variant='outline'
										>
											<FolderTree
												className={cn('h-4 w-4 shrink-0', hasSelectedGroups && 'text-primary')}
											/>
											<span
												className={cn('truncate', hasSelectedGroups ? 'text-primary' : 'text-foreground')}
											>
												{hasSelectedGroups ? selectedGroupsText : t.rupsFilter.groups}
											</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-80 p-2'>
										<div className='max-h-72 space-y-2 overflow-y-auto'>
											{groupOptions.length > 0 ? (
												groupOptions.map((group) => (
													<div key={group.id} className='flex items-center gap-2'>
														<Checkbox
															checked={selectedGroups.includes(group.id)}
															id={`group-${group.id}`}
															onCheckedChange={() => toggleGroup(group.id)}
														/>
														<label className='cursor-pointer select-none' htmlFor={`group-${group.id}`}>
															{group.label}
														</label>
													</div>
												))
											) : (
												<p className='px-1 py-2 text-sm text-muted-foreground'>{t.rupsFilter.noGroups}</p>
											)}
										</div>
									</PopoverContent>
								</Popover>
							</div>

							<div className='space-y-1'>
								<Label className='sr-only'>{t.rupsFilter.sort}</Label>
								<Select value={selectedSort} onValueChange={(value: 'asc' | 'desc') => setSelectedSort(value)}>
									<SelectTrigger
										className='h-8 justify-start gap-1.5 px-2 text-xs font-normal'
										size='sm'
										title={selectedSortLabel}
									>
										<ArrowDownUp className='h-4 w-4 shrink-0' />
										<SelectValue className='truncate text-left' placeholder={t.rupsFilter.sort} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='desc'>{t.rupsFilter.sortDesc}</SelectItem>
										<SelectItem value='asc'>{t.rupsFilter.sortAsc}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className='flex flex-wrap items-center gap-2 xl:ml-auto'>
								<Button
									className='h-8 gap-2 px-3 text-xs font-normal'
									disabled={!hasActiveFilters}
									type='button'
									variant='outline'
									onClick={resetFilters}
								>
									<RotateCcw className='h-4 w-4' />
									{t.rupsFilter.reset}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	const selectedDepartmentLabels = selectedDepartments
		.map((departmentId) => departmentOptions.find((item) => item.id === departmentId)?.label)
		.filter((label): label is string => Boolean(label))
	const selectedGroupLabels = selectedGroups
		.map((groupId) => groupOptions.find((item) => item.id === groupId)?.label)
		.filter((label): label is string => Boolean(label))

	return (
		<Card className={className}>
			<CardHeader className='gap-1'>
				<CardTitle>{t.rupsFilter.title}</CardTitle>
				<CardDescription>{t.rupsFilter.description}</CardDescription>
			</CardHeader>

			<CardContent className='h-full'>
				<div className='flex h-full flex-col gap-4'>
					<div className='grid gap-3 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto] xl:items-end'>
						<div className='space-y-1'>
							<Label className='text-xs font-medium'>{t.rupsFilter.search}</Label>
							<Input
								name='q'
								placeholder={t.rupsFilter.searchPlaceholder}
								value={searchValue}
								onChange={(event) => setSearchValue(event.target.value)}
							/>
						</div>

						<div className='space-y-1'>
							<Label className='text-xs font-medium'>{t.rupsFilter.status}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										aria-label={t.rupsFilter.status}
										className='w-full justify-between font-normal'
										role='combobox'
										title={hasSelectedStatuses ? selectedStatusesText : t.rupsFilter.status}
										type='button'
										variant='outline'
									>
										{hasSelectedStatuses ? (
											<span className='truncate text-primary'>{selectedStatusesText}</span>
										) : (
											<span className='text-muted-foreground'>{t.rupsFilter.selectStatuses}</span>
										)}
										<ChevronsUpDown
											className={cn(
												'ml-2 h-4 w-4 shrink-0 opacity-50',
												hasSelectedStatuses && 'text-primary',
											)}
										/>
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-2'>
									<div className='max-h-72 space-y-2 overflow-y-auto'>
										{Object.entries(labels).map(([status]) => (
											<div key={status} className='flex items-center gap-2'>
												<Checkbox
													checked={selectedStatuses.includes(status)}
													id={`status-${status}`}
													onCheckedChange={() => toggleStatus(status)}
												/>
												<label className='cursor-pointer select-none' htmlFor={`status-${status}`}>
													<StatusBadge status={status as StatusEnum} />
												</label>
											</div>
										))}
									</div>
								</PopoverContent>
							</Popover>
						</div>

						<div className='space-y-1'>
							<Label className='text-xs font-medium'>{t.rupsFilter.departments}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										aria-label={t.rupsFilter.departments}
										className='w-full justify-between font-normal'
										role='combobox'
										title={hasSelectedDepartments ? selectedDepartmentsText : t.rupsFilter.departments}
										type='button'
										variant='outline'
									>
										{hasSelectedDepartments ? (
											<span className='truncate text-primary'>{selectedDepartmentsText}</span>
										) : (
											<span className='text-muted-foreground'>{t.rupsFilter.selectDepartments}</span>
										)}
										<ChevronsUpDown
											className={cn(
												'ml-2 h-4 w-4 shrink-0 opacity-50',
												hasSelectedDepartments && 'text-primary',
											)}
										/>
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-2'>
									<div className='max-h-72 space-y-2 overflow-y-auto'>
										{departmentOptions.length > 0 ? (
											departmentOptions.map((department) => (
												<div key={department.id} className='flex items-center gap-2'>
													<Checkbox
														checked={selectedDepartments.includes(department.id)}
														id={`department-${department.id}`}
														onCheckedChange={() => toggleDepartment(department.id)}
													/>
													<label className='cursor-pointer select-none' htmlFor={`department-${department.id}`}>
														{department.label}
													</label>
												</div>
											))
										) : (
											<p className='px-1 py-2 text-sm text-muted-foreground'>{t.rupsFilter.noDepartments}</p>
										)}
									</div>
								</PopoverContent>
							</Popover>
						</div>

						<div className='space-y-1'>
							<Label className='text-xs font-medium'>{t.rupsFilter.groups}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										aria-label={t.rupsFilter.groups}
										className='w-full justify-between font-normal'
										role='combobox'
										title={hasSelectedGroups ? selectedGroupsText : t.rupsFilter.groups}
										type='button'
										variant='outline'
									>
										{hasSelectedGroups ? (
											<span className='truncate text-primary'>{selectedGroupsText}</span>
										) : (
											<span className='text-muted-foreground'>{t.rupsFilter.selectGroups}</span>
										)}
										<ChevronsUpDown
											className={cn('ml-2 h-4 w-4 shrink-0 opacity-50', hasSelectedGroups && 'text-primary')}
										/>
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-2'>
									<div className='max-h-72 space-y-2 overflow-y-auto'>
										{groupOptions.length > 0 ? (
											groupOptions.map((group) => (
												<div key={group.id} className='flex items-center gap-2'>
													<Checkbox
														checked={selectedGroups.includes(group.id)}
														id={`group-${group.id}`}
														onCheckedChange={() => toggleGroup(group.id)}
													/>
													<label className='cursor-pointer select-none' htmlFor={`group-${group.id}`}>
														{group.label}
													</label>
												</div>
											))
										) : (
											<p className='px-1 py-2 text-sm text-muted-foreground'>{t.rupsFilter.noGroups}</p>
										)}
									</div>
								</PopoverContent>
							</Popover>
						</div>

						<div className='space-y-1'>
							<Label className='text-xs font-medium'>{t.rupsFilter.sort}</Label>
							<Select value={selectedSort} onValueChange={(value: 'asc' | 'desc') => setSelectedSort(value)}>
								<SelectTrigger className='h-9 w-full' title={selectedSortLabel}>
									<SelectValue placeholder={t.rupsFilter.sort} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='desc'>{t.rupsFilter.sortDesc}</SelectItem>
									<SelectItem value='asc'>{t.rupsFilter.sortAsc}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end xl:w-auto'>
							<Button
								className='h-9 w-full px-5 sm:w-auto'
								disabled={!hasActiveFilters}
								type='button'
								variant='outline'
								onClick={resetFilters}
							>
								<RotateCcw className='mr-2 h-4 w-4' />
								{t.rupsFilter.reset}
							</Button>
						</div>
					</div>

					<div className='rounded-lg border bg-muted/20 p-3'>
						<div className='space-y-3'>
							<div className='space-y-2'>
								<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
									{t.rupsFilter.selectedStatusesTitle}
								</p>
								<div className='flex flex-wrap gap-1.5'>
									{selectedStatuses.length > 0 ? (
										selectedStatuses.map((status) => <StatusBadge key={status} status={status as StatusEnum} />)
									) : (
										<span className='text-sm text-muted-foreground'>{t.rupsFilter.nothingSelected}</span>
									)}
								</div>
							</div>

							<div className='grid gap-3 md:grid-cols-2'>
								<div className='space-y-2'>
									<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
										{t.rupsFilter.selectedDepartmentsTitle}
									</p>
									<div className='flex flex-wrap gap-1.5'>
										{selectedDepartmentLabels.length > 0 ? (
											selectedDepartmentLabels.map((label) => (
												<span
													key={label}
													className='inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs text-foreground'
												>
													{label}
												</span>
											))
										) : (
											<span className='text-sm text-muted-foreground'>{t.rupsFilter.nothingSelected}</span>
										)}
									</div>
								</div>

								<div className='space-y-2'>
									<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
										{t.rupsFilter.selectedGroupsTitle}
									</p>
									<div className='flex flex-wrap gap-1.5'>
										{selectedGroupLabels.length > 0 ? (
											selectedGroupLabels.map((label) => (
												<span
													key={label}
													className='inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs text-foreground'
												>
													{label}
												</span>
											))
										) : (
											<span className='text-sm text-muted-foreground'>{t.rupsFilter.nothingSelected}</span>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
