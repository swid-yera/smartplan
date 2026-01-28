'use client'

import Link from 'next/link'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Crown, Medal, Users } from 'lucide-react'

const placeStyles = (index: number) => {
	if (index === 0) return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
	if (index === 1) return 'bg-gray-50 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300'
	if (index === 2) return 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'

	return ''
}

const placeIcon = (index: number) => {
	if (index === 0) return <Crown className='h-4 w-4 text-yellow-500' />
	if (index === 1) return <Medal className='h-4 w-4 text-gray-500' />
	if (index === 2) return <Medal className='h-4 w-4 text-orange-500' />

	return null
}

export default function RatingPage() {
	const { data: usersData, isLoading } = useQuery({
		...services.user.getAllRatingOptions({
			currentPage: 1,
			pageSize: 20,
			search: '',
		}),
	})

	if (isLoading || !usersData) {
		return <Loader fullScreen type='default' />
	}

	return (
		<section className='mx-auto w-full max-w-4xl p-6 space-y-6'>
			<PageTitle description='Топ 20 лучших преподавателей по программе KPI'>Рейтинг преподавателей</PageTitle>

			{/* HEADER */}
			<Card>
				<CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<CardTitle>🏆 Топ-20 преподавателей</CardTitle>
						<CardDescription>Лучшие преподаватели по суммарным KPI баллам</CardDescription>
					</div>

					<div className='flex gap-2'>
						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/all'>
								<Users className='mr-2 h-4 w-4' />
								Все преподаватели
							</Link>
						</Button>

						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/stats'>
								<BarChart3 className='mr-2 h-4 w-4' />
								Статистика
							</Link>
						</Button>
					</div>
				</CardHeader>
			</Card>

			{/* TABLE */}
			<Card>
				<CardContent className='p-0'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-16 text-center'>#</TableHead>
								<TableHead>Преподаватель</TableHead>
								<TableHead className='text-right pr-10'>Баллы</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{usersData.data.map((u, index) => (
								<TableRow key={u.keycloakId} className={placeStyles(index)}>
									<TableCell className='py-4 text-center font-semibold'>{index + 1}</TableCell>

									<TableCell>
										<Link className='flex items-center gap-2 text-base' href={`/users/${u.keycloakId}`}>
											{placeIcon(index)}
											{u.firstName} {u.lastName}
										</Link>
									</TableCell>

									<TableCell className='text-right text-base font-semibold pr-10'>{u.totalPoints}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</section>
	)
}
