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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { StatusEnum } from '@types'
import { Filter } from 'lucide-react'

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

	const q = (searchParams.get('q') ?? '').toLowerCase().trim()
	const currentStatusParam = searchParams.get('status')
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
		currentStatusParam ? currentStatusParam.split(',') : [],
	)

	const yearFilter = (searchParams.get('year') ?? 'ALL').trim()
	const specialtyFilter = (searchParams.get('specialty') ?? 'ALL').trim()
	const distinctYears = ['2025-2026', '2026-2027', '2024-2025', '2023-2024']
	const distinctSpecialties = ['a', 'b']

	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()

		const formData = new FormData(e.target as HTMLFormElement)
		const params = new URLSearchParams(searchParams.toString())

		const qValue = formData.get('q') as string

		if (qValue) params.set('q', qValue)
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
				<form className='h-full flex flex-col justify-between gap-3' onSubmit={(e) => handleSubmit(e)}>
					<div className='grid gap-3 lg:grid-cols-2'>
						{/* search */}
						<div className='space-y-1 col-span-2'>
							<Label>{t.rupsFilter.search}</Label>
							<Input defaultValue={q} name='q' placeholder={t.rupsFilter.searchPlaceholder} />
						</div>

						<div className='space-y-1 col-span-2'>
							<Label>{t.rupsFilter.status}</Label>
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
											<span className='text-muted-foreground'>{t.rupsFilter.selectStatuses}</span>
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

						<div className='space-y-1'>
							<Label>{t.rupsFilter.studyYear}</Label>
							<Select disabled defaultValue={yearFilter} name='year'>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder={t.rupsFilter.selectYear} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='ALL'>{t.rupsFilter.allYears}</SelectItem>
									{distinctYears.map((y) => (
										<SelectItem key={y as string} value={y as string}>
											{y}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-1'>
							<Label>{t.rupsFilter.specialty}</Label>
							<Select disabled defaultValue={specialtyFilter} name='specialty'>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder={t.rupsFilter.selectSpecialty} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='ALL'>{t.rupsFilter.allSpecialties}</SelectItem>
									{distinctSpecialties.map((s) => (
										<SelectItem key={s as string} value={s as string}>
											{s}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<Button className='w-full' type='submit'>
						{t.rupsFilter.apply} <Filter />
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
