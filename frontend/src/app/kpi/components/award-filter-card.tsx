'use client'

import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { StatusBadge } from '@components'
import { getLocaleText, getStatusLabels } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
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
import { ArrowDownUp, Check, ChevronsUpDown, Filter, Layers3, ListFilter } from 'lucide-react'

import localeDictionary from './locale.json'

interface IProps {
	className?: string
	compact?: boolean
}

export const AwardFilterCard: FC<IProps> = ({ className, compact = false }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const labels = getStatusLabels(locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const currentStatusParam = searchParams.get('status')
	const currentCategoryIdParam = searchParams.get('categoryId')
	const currentSortParam = searchParams.get('sort')
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
		currentStatusParam ? currentStatusParam.split(',') : [],
	)
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
		currentCategoryIdParam
			? currentCategoryIdParam
					.split(',')
					.map((id) => id.trim())
					.filter(Boolean)
			: [],
	)
	const [selectedSort, setSelectedSort] = useState<'asc' | 'desc'>(
		currentSortParam === 'asc' || currentSortParam === 'desc' ? currentSortParam : 'desc',
	)
	const selectedStatusesText = t.awardFilter.statusesSelected.replace('{count}', String(selectedStatuses.length))
	const selectedCategoriesText = t.awardFilter.categoriesSelected.replace(
		'{count}',
		String(selectedCategoryIds.length),
	)
	const didMountRef = useRef(false)

	const { data: categories = [] } = useQuery({
		...services.categories.getAllOptions(),
	})

	const selectedCategoryIdSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds])
	const selectedCategories = useMemo(
		() =>
			categories
				.filter((category) => selectedCategoryIdSet.has(category.id))
				.sort((a, b) => getLocaleText(a.name, locale).localeCompare(getLocaleText(b.name, locale), locale)),
		[categories, locale, selectedCategoryIdSet],
	)

	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
	}
	const toggleCategory = (categoryId: string) => {
		setSelectedCategoryIds((prev) =>
			prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
		)
	}

	const applyFilters = useCallback(() => {
		const currentQuery = searchParams.toString()
		const params = new URLSearchParams(currentQuery)

		if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','))
		else params.delete('status')
		if (selectedCategoryIds.length > 0) params.set('categoryId', selectedCategoryIds.join(','))
		else params.delete('categoryId')
		params.set('sort', selectedSort)

		params.set('page', '1')

		const nextQuery = params.toString()

		if (nextQuery === currentQuery) return

		router.replace(`${pathname}?${nextQuery}`)
	}, [pathname, router, searchParams, selectedCategoryIds, selectedSort, selectedStatuses])

	useEffect(() => {
		if (!compact) return
		if (!didMountRef.current) {
			didMountRef.current = true

			return
		}

		applyFilters()
	}, [applyFilters, compact])

	if (compact) {
		return (
			<div className={cn('flex flex-col gap-2', className)}>
				<div className='flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between'>
					<div className='flex flex-wrap items-center gap-2'>
						<div className='space-y-1'>
							<Label className='sr-only'>{t.awardFilter.status}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										aria-label={t.awardFilter.status}
										className='h-8 min-w-36 justify-start gap-2 px-3 text-xs font-normal'
										role='combobox'
										title={selectedStatuses.length > 0 ? selectedStatusesText : t.awardFilter.status}
										variant='outline'
									>
										<ListFilter className='h-4 w-4 shrink-0' />
										<span className='truncate'>
											{selectedStatuses.length > 0 ? selectedStatusesText : t.awardFilter.status}
										</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-80 p-2'>
									<div className='space-y-2'>
										{Object.entries(labels).map((option) => (
											<div key={option[0]} className='flex items-center space-x-2'>
												<Checkbox
													checked={selectedStatuses.includes(option[0])}
													id={option[0]}
													onCheckedChange={() => toggleStatus(option[0])}
												/>
												<label className='cursor-pointer select-none' htmlFor={option[0]}>
													<StatusBadge status={option[0] as StatusEnum} />
												</label>
											</div>
										))}
									</div>
								</PopoverContent>
							</Popover>
						</div>

						<div className='space-y-1'>
							<Label className='sr-only'>{t.awardFilter.category}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										aria-label={t.awardFilter.category}
										className='h-8 min-w-40 justify-start gap-2 px-3 text-xs font-normal'
										role='combobox'
										title={selectedCategories.length > 0 ? selectedCategoriesText : t.awardFilter.category}
										variant='outline'
									>
										<Layers3 className='h-4 w-4 shrink-0' />
										<span className='truncate'>
											{selectedCategories.length > 0 ? selectedCategoriesText : t.awardFilter.category}
										</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-(--radix-popover-trigger-width) min-w-96 p-0'>
									<Command>
										<CommandInput className='h-8 text-xs' placeholder={t.awardFilter.searchCategory} />
										<CommandList>
											<CommandEmpty>{t.awardFilter.categoryNotFound}</CommandEmpty>
											<CommandGroup>
												{categories.map((category) => {
													const categoryName = getLocaleText(category.name, locale)

													return (
														<CommandItem
															key={category.id}
															value={categoryName}
															onSelect={() => toggleCategory(category.id)}
														>
															<Check
																className={cn(
																	'mr-2 h-4 w-4',
																	selectedCategoryIdSet.has(category.id) ? 'opacity-100' : 'opacity-0',
																)}
															/>
															{categoryName}
														</CommandItem>
													)
												})}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					<div className='space-y-1 xl:ml-auto'>
						<Label className='sr-only'>{t.awardFilter.sort}</Label>
						<Select value={selectedSort} onValueChange={(value: 'asc' | 'desc') => setSelectedSort(value)}>
							<SelectTrigger
								aria-label={t.awardFilter.sort}
								className='h-8 justify-start gap-1.5 px-2 text-xs font-normal'
								size='sm'
								title={selectedSort === 'asc' ? t.awardFilter.sortAsc : t.awardFilter.sortDesc}
							>
								<ArrowDownUp className='h-4 w-4 shrink-0' />
								<SelectValue className='truncate text-left' placeholder={t.awardFilter.sort} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='desc'>{t.awardFilter.sortDesc}</SelectItem>
								<SelectItem value='asc'>{t.awardFilter.sortAsc}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		)
	}

	return (
		<Card className={className}>
			<CardHeader className={cn('gap-1', compact && 'px-4 py-3')}>
				<CardTitle className={compact ? 'text-base' : undefined}>{t.awardFilter.title}</CardTitle>
				{!compact && <CardDescription>{t.awardFilter.description}</CardDescription>}
			</CardHeader>
			<CardContent className={cn('h-full', compact && 'px-4 pb-4 pt-0')}>
				<form
					className={cn('flex h-full flex-col', compact ? 'gap-3' : 'gap-4')}
					onSubmit={(e) => {
						e.preventDefault()
						applyFilters()
					}}
				>
					<div
						className={cn(
							'flex flex-col gap-3',
							compact ? 'lg:flex-row lg:items-end' : 'xl:flex-row xl:items-end',
						)}
					>
						<div
							className={cn(
								'grid w-full gap-3',
								compact
									? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1.35fr)_minmax(0,0.9fr)]'
									: 'md:grid-cols-3',
							)}
						>
							{/* status */}
							<div className='space-y-1'>
								<Label className='text-xs font-medium'>{t.awardFilter.status}</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											className='h-9 w-full justify-between font-normal'
											role='combobox'
											variant='outline'
										>
											{selectedStatuses.length > 0 ? (
												<span className='truncate'>{selectedStatusesText}</span>
											) : (
												<span className='text-muted-foreground'>{t.awardFilter.selectStatuses}</span>
											)}
											<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-2'>
										<div className='space-y-2'>
											{Object.entries(labels).map((option) => (
												<div key={option[0]} className='flex items-center space-x-2'>
													<Checkbox
														checked={selectedStatuses.includes(option[0])}
														id={option[0]}
														onCheckedChange={() => toggleStatus(option[0])}
													/>
													<label className='cursor-pointer select-none' htmlFor={option[0]}>
														<StatusBadge status={option[0] as StatusEnum} />
													</label>
												</div>
											))}
										</div>
									</PopoverContent>
								</Popover>
							</div>

							{/* category */}
							<div className='space-y-1'>
								<Label className='text-xs font-medium'>{t.awardFilter.category}</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											className='h-9 w-full justify-between font-normal'
											role='combobox'
											variant='outline'
										>
											{selectedCategories.length > 0 ? (
												<span className='truncate'>{selectedCategoriesText}</span>
											) : (
												<span className='text-muted-foreground'>{t.awardFilter.selectCategories}</span>
											)}
											<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-0'>
										<Command>
											<CommandInput className='h-9' placeholder={t.awardFilter.searchCategory} />
											<CommandList>
												<CommandEmpty>{t.awardFilter.categoryNotFound}</CommandEmpty>
												<CommandGroup>
													{categories.map((category) => {
														const categoryName = getLocaleText(category.name, locale)

														return (
															<CommandItem
																key={category.id}
																value={categoryName}
																onSelect={() => toggleCategory(category.id)}
															>
																<Check
																	className={cn(
																		'mr-2 h-4 w-4',
																		selectedCategoryIdSet.has(category.id)
																			? 'opacity-100'
																			: 'opacity-0',
																	)}
																/>
																{categoryName}
															</CommandItem>
														)
													})}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>

							{/* sort */}
							<div className='space-y-1'>
								<Label className='text-xs font-medium'>{t.awardFilter.sort}</Label>
								<Select value={selectedSort} onValueChange={(value: 'asc' | 'desc') => setSelectedSort(value)}>
									<SelectTrigger className='h-9 w-full'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='desc'>{t.awardFilter.sortDesc}</SelectItem>
										<SelectItem value='asc'>{t.awardFilter.sortAsc}</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='flex w-full justify-end lg:w-auto'>
							<Button className='h-9 w-full px-5 lg:w-auto' type='submit'>
								{t.awardFilter.apply} <Filter />
							</Button>
						</div>
					</div>

					{!compact && (
						<div className='rounded-lg border bg-muted/20 p-3'>
							<div className='space-y-3'>
								<div className='space-y-2'>
									<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
										{t.awardFilter.selectedStatusesTitle}
									</p>
									<div className='flex flex-wrap gap-1.5'>
										{selectedStatuses.length > 0 ? (
											selectedStatuses.map((status) => (
												<StatusBadge key={status} status={status as StatusEnum} />
											))
										) : (
											<span className='text-sm text-muted-foreground'>{t.awardFilter.nothingSelected}</span>
										)}
									</div>
								</div>

								<div className='space-y-2'>
									<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
										{t.awardFilter.selectedCategoriesTitle}
									</p>
									<div className='flex flex-wrap gap-1.5'>
										{selectedCategories.length > 0 ? (
											selectedCategories.map((category) => (
												<Badge key={category.id} variant='secondary'>
													{getLocaleText(category.name, locale)}
												</Badge>
											))
										) : (
											<span className='text-sm text-muted-foreground'>{t.awardFilter.nothingSelected}</span>
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	)
}
