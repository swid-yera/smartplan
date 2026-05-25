'use client'

import { useMemo } from 'react'

import Link from 'next/link'

import { Loader, PageTitle } from '@components'
import { getLocaleText, getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart3, Users } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import localeDictionary from './locale.json'

const placeStyles = (index: number) => {
	if (index === 0) return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
	if (index === 1) return 'bg-gray-50 text-gray-700 dark:bg-zinc-900 dark:text-zinc-300'
	if (index === 2) return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'

	return 'border'
}

export default function RatingDepartmentsPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { data: departments, isLoading } = useQuery({
		...services.award.getAllDepartmentsOptions(),
	})

	const sortedDepartments = useMemo(() => {
		if (!departments) return []

		return [...departments].sort((a, b) => b.totalPoints - a.totalPoints)
	}, [departments])

	if (isLoading || !departments) {
		return <Loader fullScreen type='default' />
	}

	if (sortedDepartments.length === 0) {
		return (
			<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
				<PageTitle description={t.description}>{t.title}</PageTitle>
				<Card className='border-dashed'>
					<CardContent className='py-12 text-center'>
						<p className='text-base font-medium'>{t.emptyTitle}</p>
						<p className='mt-2 text-sm text-muted-foreground'>{t.emptyDescription}</p>
					</CardContent>
				</Card>
			</section>
		)
	}

	const topDepartments = sortedDepartments.slice(0, 10)
	const chartData = sortedDepartments.map((department) => ({
		name: getLocaleText(department.name, locale),
		points: department.totalPoints,
		users: department.userCount,
	}))

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<Card>
				<CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
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
								<Users className='mr-2 h-4 w-4' />
								{t.allTeachers}
							</Link>
						</Button>

						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/stats'>
								<BarChart3 className='mr-2 h-4 w-4' />
								{t.stats}
							</Link>
						</Button>
					</div>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t.topDepartments}</CardTitle>
				</CardHeader>
				<CardContent className='space-y-2'>
					{topDepartments.map((department, index) => (
						<div key={department.keycloakId} className={`flex items-center justify-between rounded-lg p-3 ${placeStyles(index)}`}>
							<div>
								<p className='font-medium'>
									{index + 1}. {getLocaleText(department.name, locale)}
								</p>
								<p className='text-xs text-muted-foreground'>
									{department.userCount} {t.usersCount}
								</p>
							</div>
							<p className='text-lg font-semibold'>{department.totalPoints}</p>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t.distribution}</CardTitle>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width='100%' height={320}>
						<BarChart data={chartData}>
							<XAxis dataKey='name' hide />
							<YAxis />
							<Tooltip formatter={(value) => [value, t.points]} />
							<Bar dataKey='points' fill='#3b82f6' />
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</section>
	)
}
