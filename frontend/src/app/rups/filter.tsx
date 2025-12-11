import type { FC } from 'react'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'

interface IFilter {
	searchParams?: {
		q?: string
		status?: string
		year?: string
		specialty?: string
	}
	items: {
		year: string
		specialty: string
	}[]
}

export const Filter: FC<IFilter> = ({ searchParams, items }) => {
	const q = (searchParams?.q ?? '').toLowerCase().trim()
	const statusFilter = searchParams?.status ?? 'ALL'
	const yearFilter = (searchParams?.year ?? '').trim()
	const specialtyFilter = (searchParams?.specialty ?? '').trim()

	const distinctYears = Array.from(new Set(items.map((i) => i.year).filter(Boolean)))
	const distinctSpecialties = Array.from(new Set(items.map((i) => i.specialty ?? i.specialty).filter(Boolean)))

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-sm'>Фильтры</CardTitle>
				<CardDescription className='text-xs'>
					Можно быстро отфильтровать РУП по году, специальности и статусу.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className='grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]' method='GET'>
					<div>
						<label className='mb-1 block text-xs font-medium text-slate-500'>Поиск</label>
						<input
							className='w-full rounded-md border px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2'
							defaultValue={q}
							name='q'
							placeholder='Наименование, специальность...'
						/>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium'>Статус</label>
						<select
							className='w-full rounded-md border px-2 py-1 text-sm shadow-sm'
							defaultValue={statusFilter}
							name='status'
						>
							<option value='ALL'>Все</option>
							<option value='DRAFT'>Черновик</option>
							<option value='IN_REVIEW'>На согласовании</option>
							<option value='APPROVED'>Утверждён</option>
						</select>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium text-slate-500'>Учебный год</label>
						<select
							className='w-full rounded-md border  px-2 py-1 text-sm shadow-sm '
							defaultValue={yearFilter}
							name='year'
						>
							<option value=''>Все годы</option>
							{distinctYears.map((y) => (
								<option key={y as string} value={y as string}>
									{y}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium'>Специальность</label>
						<select
							className='w-full rounded-md border  px-2 py-1 text-sm shadow-sm dark:b'
							defaultValue={specialtyFilter}
							name='specialty'
						>
							<option value=''>Все</option>
							{distinctSpecialties.map((s) => (
								<option key={s as string} value={s as string}>
									{s}
								</option>
							))}
						</select>
					</div>

					<div className='flex items-end'>
						<Button className='w-full' size='sm' type='submit'>
							Применить
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
