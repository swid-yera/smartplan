'use client'

import type { FC } from 'react'

import { useSearchParams } from 'next/navigation'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@ui'
import { Filter } from 'lucide-react'

interface IProps {
	className?: string
}

export const FilterCard: FC<IProps> = ({ className }) => {
	const searchParams = useSearchParams()
	const q = (searchParams.get('q') ?? '').toLowerCase().trim()
	const statusFilter = searchParams.get('status') ?? 'ALL'
	const yearFilter = (searchParams.get('year') ?? '').trim()
	const specialtyFilter = (searchParams.get('specialty') ?? '').trim()

	const distinctYears = ['2025-2026', '2026-2027', '2024-2025', '2023-2024']
	const distinctSpecialties = ['a', 'b']

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Фильтры</CardTitle>
				<CardDescription>Можно быстро отфильтровать РУП по году, специальности и статусу.</CardDescription>
			</CardHeader>
			<CardContent className='h-full'>
				<form className='h-full flex flex-col justify-between gap-3' method='GET'>
					<div className='grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto]'>
						<div className='space-y-1'>
							<Label>Поиск</Label>
							<Input defaultValue={q} name='q' placeholder='Наименование, специальность...' />
						</div>

						<div className='space-y-1'>
							<Label>Статус</Label>
							<Select defaultValue={statusFilter} name='status'>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Выберите статус' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='ALL'>Все статусы</SelectItem>
									<SelectItem value='DRAFT'>Черновик</SelectItem>
									<SelectItem value='IN_REVIEW'>На согласовании</SelectItem>
									<SelectItem value='APPROVED'>Утверждён</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-1'>
							<Label>Учебный год</Label>
							<Select defaultValue={yearFilter} name='year'>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Выберите год' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='ALL'>Все годы обучения</SelectItem>
									{distinctYears.map((y) => (
										<SelectItem key={y as string} value={y as string}>
											{y}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-1'>
							<Label>Специальность</Label>
							<Select defaultValue={specialtyFilter} name='specialty'>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Выберите специальность' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='ALL'>Все специальности</SelectItem>
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
						Применить <Filter />
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
