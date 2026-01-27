'use client'

import { useState } from 'react'

import { Loader, PageTitle, Pagination } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import {
	Button,
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
import { Crown, Medal, Search, SearchIcon } from 'lucide-react'

const placeStyles = (index: number, showLeaders: boolean) => {
	if (!showLeaders) return ''

	if (index === 0) return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
	if (index === 1) return 'bg-gray-50 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300'
	if (index === 2) return 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'

	return ''
}

const placeIcon = (index: number, showLeaders: boolean) => {
	if (!showLeaders) return null

	if (index === 0) return <Crown className='h-4 w-4 text-yellow-500' />
	if (index === 1) return <Medal className='h-4 w-4 text-gray-500' />
	if (index === 2) return <Medal className='h-4 w-4 text-orange-500' />

	return null
}

export default function RatingPage() {
	const [searchInput, setSearchInput] = useState('')
	const [search, setSearch] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)

	const showLeaders = search === ''

	const applySearch = () => {
		setCurrentPage(1)
		setSearch(searchInput.trim())
	}

	const { data: usersData, isLoading } = useQuery({
		...services.user.getAllRatingOptions({
			currentPage,
			pageSize,
			search,
		}),
	})

	if (isLoading || !usersData) {
		return <Loader fullScreen type='default' />
	}

	return (
		<section className='mx-auto w-full max-w-4xl p-6 space-y-6'>
			<PageTitle>Рейтинг преподавателей по программе KPI</PageTitle>

			{/* HEADER */}
			<Card>
				<CardHeader>
					<CardTitle>Рейтинг преподавателей</CardTitle>
					<CardDescription>Рейтинг преподавателей по программе KPI</CardDescription>

					<div className='flex gap-2 max-w-xl mt-4'>
						<div className='relative flex-1'>
							<Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
							<Input
								className='pl-9'
								placeholder='Поиск по ФИО'
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										applySearch()
									}
								}}
							/>
						</div>

						<Button size='default' variant='default' onClick={applySearch}>
							<SearchIcon />
							Найти
						</Button>
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
								{usersData.data.map((u, i) => {
									const globalIndex = (currentPage - 1) * usersData.meta.pageSize + i

									return (
										<TableRow key={u.keycloakId} className={placeStyles(globalIndex, showLeaders)}>
											<TableCell className='text-center font-semibold'>{globalIndex + 1}</TableCell>

											<TableCell className='flex items-center gap-2'>
												{placeIcon(globalIndex, showLeaders)}
												{u.firstName} {u.lastName}
											</TableCell>

											<TableCell className='text-right font-medium'>{u.totalPoints}</TableCell>
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
				{usersData.data.map((u, i) => {
					const globalIndex = (currentPage - 1) * usersData.meta.pageSize + i

					return (
						<Card key={u.keycloakId} className={placeStyles(globalIndex, showLeaders)}>
							<CardContent className='flex items-center justify-between p-4'>
								<div>
									<p className='font-semibold'>
										{globalIndex + 1}. {u.firstName} {u.lastName}
									</p>
									<p className='text-sm text-muted-foreground'>KPI баллы</p>
								</div>

								<div className='flex items-center gap-2 font-semibold'>
									{placeIcon(globalIndex, showLeaders)}
									{u.totalPoints}
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{/* PAGINATION */}
			<Pagination
				page={usersData.meta.currentPage}
				pageSize={usersData.meta.pageSize}
				totalPages={usersData.meta.total}
				onPageChange={(page) => setCurrentPage(page)}
				onPageSizeChange={(size) => setPageSize(size)}
			/>
		</section>
	)
}
