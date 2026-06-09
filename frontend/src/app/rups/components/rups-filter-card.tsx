'use client'

import { type FC, useCallback, useEffect, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { StatusBadge } from '@components'
import { getStatusLabels } from '@helpers'
import { cn } from '@lib'
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
import { StatusEnum } from '@types'
import { ArrowDownUp, ChevronsUpDown, ListFilter, RotateCcw } from 'lucide-react'

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
	const [selectedSort, setSelectedSort] = useState<'asc' | 'desc'>(initialState.sort)
	const didMountRef = useRef(false)

	const selectedStatusesText = t.rupsFilter.statusesSelected.replace('{count}', String(selectedStatuses.length))
	const selectedSortLabel = selectedSort === 'asc' ? t.rupsFilter.sortAsc : t.rupsFilter.sortDesc
	const hasActiveFilters = Boolean(
		searchValue.trim() || selectedStatuses.length > 0 || selectedSort !== DEFAULT_RUP_SORT,
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
		setSelectedSort((prev) => (prev === nextState.sort ? prev : nextState.sort))
	}, [paramPrefix, searchParamsString])

	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) =>
			prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status],
		)
	}

	const applyFilters = useCallback(() => {
		const currentQuery = searchParams.toString()
		const params = buildRupFilterSearchParams(
			new URLSearchParams(currentQuery),
			{
				search: searchValue,
				statuses: selectedStatuses,
				sort: selectedSort,
			},
			{ resetPage: true, paramPrefix },
		)
		const nextQuery = params.toString()

		persistRupFilterState(
			{
				search: searchValue,
				statuses: selectedStatuses,
				sort: selectedSort,
			},
			storageKey,
		)

		if (nextQuery === currentQuery) return

		router.replace(`${pathname}?${nextQuery}`, { scroll: false })
	}, [paramPrefix, pathname, router, searchParams, searchValue, selectedSort, selectedStatuses, storageKey])

	useEffect(() => {
		if (!didMountRef.current) {
			didMountRef.current = true

			return
		}

		applyFilters()
	}, [applyFilters, searchValue, selectedStatuses, selectedSort])

	const resetFilters = useCallback(() => {
		const defaults = {
			search: '',
			statuses: [] as string[],
			sort: DEFAULT_RUP_SORT,
		}
		const params = buildRupFilterSearchParams(new URLSearchParams(searchParams.toString()), defaults, {
			resetPage: true,
			paramPrefix,
		})

		clearPersistedRupFilterState(storageKey)
		setSearchValue(defaults.search)
		setSelectedStatuses(defaults.statuses)
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
											title={selectedStatuses.length > 0 ? selectedStatusesText : t.rupsFilter.status}
											type='button'
											variant='outline'
										>
											<ListFilter className='h-4 w-4 shrink-0' />
											<span className='truncate'>
												{selectedStatuses.length > 0 ? selectedStatusesText : t.rupsFilter.status}
											</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-80 p-2'>
										<div className='space-y-2'>
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

	return (
		<Card className={className}>
			<CardHeader className='gap-1'>
				<CardTitle>{t.rupsFilter.title}</CardTitle>
				<CardDescription>{t.rupsFilter.description}</CardDescription>
			</CardHeader>

			<CardContent className='h-full'>
				<div className='flex h-full flex-col gap-4'>
					<div className='flex flex-col gap-3 xl:flex-row xl:items-end'>
						<div className='grid w-full gap-3 md:grid-cols-3'>
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
											title={selectedStatuses.length > 0 ? selectedStatusesText : t.rupsFilter.status}
											type='button'
											variant='outline'
										>
											{selectedStatuses.length > 0 ? (
												<span className='truncate'>{selectedStatusesText}</span>
											) : (
												<span className='text-muted-foreground'>{t.rupsFilter.selectStatuses}</span>
											)}
											<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-2'>
										<div className='space-y-2'>
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
						</div>

						<div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end lg:w-auto'>
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
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
