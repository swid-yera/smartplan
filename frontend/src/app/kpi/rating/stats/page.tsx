'use client'

import { useMemo } from 'react'

import Link from 'next/link'

import { Loader, PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { IUser } from '@types'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import localeDictionary from './locale.json'

export default function RatingStatsPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { data: usersData, isLoading } = useQuery({
		...services.user.getAllRatingOptions({ currentPage: 1, pageSize: 100 }),
	})

	// сортировка по totalPoints
	const sortedUsers = useMemo(() => {
		if (!usersData?.data) return []

		return [...usersData.data].sort((a: IUser, b: IUser) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
	}, [usersData])

	if (isLoading || !usersData) return <Loader fullScreen type='default' />

	// топ 10
	const topUsers = sortedUsers.slice(0, 10)

	// средний балл
	const averagePoints = sortedUsers.reduce((sum, u) => sum + (u.totalPoints ?? 0), 0) / (sortedUsers.length || 1)

	// данные для графика (распределение)
	const chartData = sortedUsers.map((u) => ({
		name: `${u.firstName} ${u.lastName}`,
		points: u.totalPoints ?? 0,
	}))

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			{/* HEADER */}
			<Card>
				<CardHeader className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
					<div>
						<CardTitle>{t.headerTitle}</CardTitle>
						<CardDescription>{t.headerDescription}</CardDescription>
					</div>

					<div className='flex gap-2'>
						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating'>
								<ArrowLeft className='mr-2 h-4 w-4' />
								{t.top20}
							</Link>
						</Button>

						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/all'>
								<BarChart3 className='mr-2 h-4 w-4' />
								{t.allTeachers}
							</Link>
						</Button>
					</div>
				</CardHeader>
			</Card>

			{/* СРЕДНИЙ БАЛЛ */}
			<Card>
				<CardContent className='text-center'>
					<p className='text-muted-foreground'>{t.averageTitle}</p>
					<p className='text-3xl font-bold'>{averagePoints.toFixed(1)}</p>
				</CardContent>
			</Card>

			{/* ТОП 10 */}
			<Card>
				<CardHeader>
					<CardTitle>{t.top10}</CardTitle>
				</CardHeader>
				<CardContent className='space-y-2'>
					{topUsers.map((u, i) => (
						<div
							key={u.keycloakId}
							className={`flex justify-between items-center rounded-lg p-3 ${
								i === 0
									? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
									: i === 1
										? 'bg-gray-50 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300'
										: i === 2
											? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
											: 'border'
							}`}
						>
							<p className='font-medium'>
								{i + 1}. {u.firstName} {u.lastName}
							</p>
							<p className='font-semibold'>{u.totalPoints ?? 0}</p>
						</div>
					))}
				</CardContent>
			</Card>

			{/* ГРАФИК РАСПРЕДЕЛЕНИЯ */}
			<Card>
				<CardHeader>
					<CardTitle>{t.distribution}</CardTitle>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer height={300} width='100%'>
						<BarChart data={chartData}>
							<XAxis hide dataKey='name' />
							<YAxis />
							<Tooltip />
							<Bar dataKey='points' fill='#3b82f6' />
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</section>
	)
}
