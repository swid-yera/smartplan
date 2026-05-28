'use client'

import { useMemo } from 'react'

import { Loader, PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { IUser } from '@types'

import { RatingDistributionChart } from '../components/rating-distribution-chart'
import { RatingNav } from '../components/rating-nav'
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
		value: u.totalPoints ?? 0,
	}))

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>
			<RatingNav
				labels={{
					allTeachers: t.allTeachers,
					departments: t.departments,
					stats: t.stats,
					top20: t.top20,
				}}
			/>

			{/* HEADER */}
			<Card>
				<CardHeader>
					<div>
						<CardTitle>{t.headerTitle}</CardTitle>
						<CardDescription>{t.headerDescription}</CardDescription>
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
					<RatingDistributionChart data={chartData} valueLabel={t.points} />
				</CardContent>
			</Card>
		</section>
	)
}
