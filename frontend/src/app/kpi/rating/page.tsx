'use client'

import { useMemo, useState } from 'react'

import { Pagination } from '@components'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { Crown, Medal, Search } from 'lucide-react'

interface ITeacherRating {
	id: string
	name: string
	points: number
}

// ❗ временно mock, легко заменить на API
const MOCK_DATA: ITeacherRating[] = Array.from({ length: 300 }).map((_, i) => ({
	id: String(i + 1),
	name: `Преподаватель ${i + 1}`,
	points: Math.floor(Math.random() * 300 + 50),
}))

const PAGE_SIZE = 10

const placeStyles = (index: number) => {
	if (index === 0) return 'bg-yellow-50 text-yellow-600'
	if (index === 1) return 'bg-gray-50 text-gray-600'
	if (index === 2) return 'bg-orange-50 text-orange-600'

	return ''
}

const placeIcon = (index: number) => {
	if (index === 0) return <Crown className='h-4 w-4 text-yellow-500' />
	if (index === 1) return <Medal className='h-4 w-4 text-gray-500' />
	if (index === 2) return <Medal className='h-4 w-4 text-orange-500' />

	return null
}

export default function RatingPage() {
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)

	// сортировка + поиск
	const filtered = useMemo(() => {
		return [...MOCK_DATA]
			.sort((a, b) => b.points - a.points)
			.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
	}, [search])

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

	const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	return (
		<div className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			{/* Header */}
			<Card>
				<CardHeader>
					<CardTitle>Рейтинг преподавателей</CardTitle>
					<CardDescription>Рейтинг преподавателей по программе KPI</CardDescription>

					<div className='relative max-w-sm mt-4'>
						<Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
						<Input
							className='pl-9'
							placeholder='Поиск по ФИО'
							value={search}
							onChange={(e) => {
								setSearch(e.target.value)
								setPage(1)
							}}
						/>
					</div>
				</CardHeader>
			</Card>

			{/* DESKTOP TABLE */}
			<div className='hidden md:block'>
				<Card>
					<CardContent className='p-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-16 text-center'>#</TableHead>
									<TableHead>Преподаватель</TableHead>
									<TableHead className='text-right'>Баллы</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{pageData.map((t, i) => {
									const globalIndex = (page - 1) * PAGE_SIZE + i

									return (
										<TableRow key={t.id} className={placeStyles(globalIndex)}>
											<TableCell className='text-center font-semibold'>{globalIndex + 1}</TableCell>

											<TableCell className='flex items-center gap-2'>
												{placeIcon(globalIndex)}
												{t.name}
											</TableCell>

											<TableCell className='text-right font-medium'>{t.points}</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			{/* MOBILE CARDS */}
			<div className='md:hidden space-y-3'>
				{pageData.map((t, i) => {
					const globalIndex = (page - 1) * PAGE_SIZE + i

					return (
						<Card key={t.id} className={placeStyles(globalIndex)}>
							<CardContent className='flex items-center justify-between p-4'>
								<div>
									<p className='font-semibold'>
										{globalIndex + 1}. {t.name}
									</p>
									<p className='text-sm text-muted-foreground'>KPI баллы</p>
								</div>

								<div className='flex items-center gap-2 font-semibold'>
									{placeIcon(globalIndex)}
									{t.points}
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			<Pagination
				page={page}
				pageSize={10}
				totalPages={totalPages}
				onPageChange={(page) => setPage(page)}
				onPageSizeChange={() => false}
			/>
		</div>
	)
}
