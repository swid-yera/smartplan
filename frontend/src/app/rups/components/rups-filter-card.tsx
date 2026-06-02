'use client'

import { type FC, type FormEvent, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { StatusBadge } from '@components'
import { getStatusLabels } from '@helpers'
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
} from '@shadcn'
import { useLocaleStore } from '@store'
import { StatusEnum } from '@types'
import { ChevronsUpDown, Filter } from 'lucide-react'

import localeDictionary from './locale.json'

interface IProps {
	className?: string
}

export const RupsFilterCard: FC<IProps> = ({ className }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const labels = getStatusLabels(locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const currentStatusParam = searchParams.get('status')
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
		currentStatusParam ? currentStatusParam.split(',') : [],
	)
	const selectedStatusesText = t.rupsFilter.statusesSelected.replace('{count}', String(selectedStatuses.length))

	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) =>
			prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status],
		)
	}

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault()

		const formData = new FormData(event.target as HTMLFormElement)
		const params = new URLSearchParams(searchParams.toString())
		const searchValue = (formData.get('q') as string | null)?.trim() ?? ''

		if (searchValue) params.set('q', searchValue)
		else params.delete('q')

		if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','))
		else params.delete('status')

		params.set('page', '1')

		router.replace(`${pathname}?${params.toString()}`)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{t.rupsFilter.title}</CardTitle>
				<CardDescription>{t.rupsFilter.description}</CardDescription>
			</CardHeader>
			<CardContent className='h-full'>
				<form className='flex h-full flex-col gap-4' onSubmit={handleSubmit}>
					<div className='flex flex-col gap-3 xl:flex-row xl:items-end'>
						<div className='grid w-full gap-3 md:grid-cols-2'>
							<div className='space-y-1'>
								<Label>{t.rupsFilter.search}</Label>
								<Input
									defaultValue={searchParams.get('q') ?? ''}
									name='q'
									placeholder={t.rupsFilter.searchPlaceholder}
								/>
							</div>

							<div className='space-y-1'>
								<Label>{t.rupsFilter.status}</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button className='w-full justify-between font-normal' role='combobox' variant='outline'>
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
						</div>

						<div className='flex w-full justify-end xl:w-auto'>
							<Button className='w-full px-8 xl:w-auto' type='submit'>
								{t.rupsFilter.apply} <Filter />
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
				</form>
			</CardContent>
		</Card>
	)
}
