'use client'

import { type FC, type FormEvent, useMemo, useState } from 'react'

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
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { StatusEnum } from '@types'
import { Check, ChevronsUpDown, Filter } from 'lucide-react'

import localeDictionary from './locale.json'

interface IProps {
	className?: string
}

export const AwardFilterCard: FC<IProps> = ({ className }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const labels = getStatusLabels(locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const currentStatusParam = searchParams.get('status')
	const currentCategoryIdParam = searchParams.get('categoryId')
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

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()

		const params = new URLSearchParams(searchParams.toString())

		if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','))
		else params.delete('status')
		if (selectedCategoryIds.length > 0) params.set('categoryId', selectedCategoryIds.join(','))
		else params.delete('categoryId')

		params.set('page', '1')

		router.replace(`${pathname}?${params.toString()}`)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{t.awardFilter.title}</CardTitle>
				<CardDescription>{t.awardFilter.description}</CardDescription>
			</CardHeader>
			<CardContent className='h-full'>
				<form className='h-full flex justify-between items-center gap-3' onSubmit={(e) => handleSubmit(e)}>
					<div className='grid gap-3 md:grid-cols-2 w-full'>
						{/* status */}
						<div className='space-y-1'>
							<Label>{t.awardFilter.status}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button className='w-full justify-start font-normal' variant='outline'>
										{selectedStatuses.length > 0 ? (
											<div className='flex gap-1 flex-wrap'>
												{selectedStatuses.map((s) => (
													<StatusBadge key={s} status={s as StatusEnum} />
												))}
											</div>
										) : (
											<span className='text-muted-foreground'>{t.awardFilter.selectStatuses}</span>
										)}
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
												<label
													className='text-sm font-medium leading-none cursor-pointer select-none'
													htmlFor={option[0]}
												>
													{option[1]}
												</label>
											</div>
										))}
									</div>
								</PopoverContent>
							</Popover>
						</div>

						{/* category */}
						<div className='space-y-1'>
							<Label>{t.awardFilter.category}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button className='w-full justify-between font-normal' role='combobox' variant='outline'>
										{selectedCategories.length > 0 ? (
											<div className='flex gap-1 flex-wrap'>
												{selectedCategories.map((category) => (
													<Badge key={category.id} variant='secondary'>
														{getLocaleText(category.name, locale)}
													</Badge>
												))}
											</div>
										) : (
											<span className='text-muted-foreground'>{t.awardFilter.selectCategories}</span>
										)}
										<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-0'>
									<Command>
										<CommandInput placeholder={t.awardFilter.searchCategory} />
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
					</div>

					<div className='flex justify-end w-full'>
						<Button className='w-min px-8!' type='submit'>
							{t.awardFilter.apply} <Filter />
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
