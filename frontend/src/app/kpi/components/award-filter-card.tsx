'use client'

import { type FC, type FormEvent, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { StatusBadge } from '@components'
import { statusLabels } from '@helpers'
import { StatusEnum } from '@types'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@ui'
import { Filter } from 'lucide-react'

interface IProps {
	className?: string
}

export const AwardFilterCard: FC<IProps> = ({ className }) => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const currentStatusParam = searchParams.get('status')
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
		currentStatusParam ? currentStatusParam.split(',') : [],
	)

	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()

		const params = new URLSearchParams(searchParams.toString())

		if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','))
		else params.delete('status')

		params.set('page', '1')

		router.replace(`${pathname}?${params.toString()}`)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Фильтры</CardTitle>
				<CardDescription>Можно быстро отфильтровать награды преподавателей по статусу.</CardDescription>
			</CardHeader>
			<CardContent className='h-full'>
				<form className='h-full flex justify-between items-center gap-3' onSubmit={(e) => handleSubmit(e)}>
					<div className='grid gap-3 lg:grid-cols-2 w-full'>
						{/* status */}
						<div className='space-y-1 col-span-2'>
							<Label>Статус</Label>
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
											<span className='text-muted-foreground'>Выберите статусы</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-(--radix-popover-trigger-width) p-2'>
									<div className='space-y-2'>
										{Object.entries(statusLabels).map((option) => (
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
					</div>

					<div className='flex justify-end w-full'>
						<Button className='w-min px-8!' type='submit'>
							Применить <Filter />
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
