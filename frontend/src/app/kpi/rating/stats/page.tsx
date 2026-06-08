'use client'

import { useMemo } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Loader, PageTitle, withRole } from '@components'
import { getLocaleText, getUILocaleSection } from '@helpers'
import { services } from '@services'
import {
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
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { IUserDepartment } from '@types'
import { RoleEnum } from '@types'

import { RatingDistributionChart } from '../components/rating-distribution-chart'
import { RatingNav } from '../components/rating-nav'
import localeDictionary from './locale.json'

const RATING_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
] as const

function RatingStatsPage() {
	const locale = useLocaleStore((state) => state.locale)
	const router = useRouter()
	const t = getUILocaleSection(localeDictionary, locale)
	const { data: teachers, isLoading } = useQuery({
		...services.user.getTeachersRatingOptions(),
	})

	const sortedTeachers = useMemo(() => {
		if (!teachers?.length) return []

		return [...teachers].sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
	}, [teachers])

	if (isLoading || !teachers) return <Loader fullScreen type='default' />

	if (sortedTeachers.length === 0) {
		return (
			<section className='mx-auto w-full max-w-6xl p-6 space-y-6'>
				<PageTitle description={t.description}>{t.title}</PageTitle>
				<RatingNav
					labels={{
						departments: t.departments,
						stats: t.stats,
						top20: t.top20,
					}}
				/>
				<Card className='border-dashed'>
					<CardContent className='py-12 text-center'>
						<p className='text-base font-medium'>{t.emptyTitle}</p>
						<p className='mt-2 text-sm text-muted-foreground'>{t.emptyDescription}</p>
					</CardContent>
				</Card>
			</section>
		)
	}

	const averagePoints =
		sortedTeachers.reduce((sum, teacher) => sum + (teacher.totalPoints ?? 0), 0) / (sortedTeachers.length || 1)

	const chartData = sortedTeachers.map((teacher) => ({
		keycloakId: teacher.keycloakId,
		name: `${teacher.firstName} ${teacher.lastName}`.trim(),
		value: teacher.totalPoints ?? 0,
		departments: (teacher.departments ?? teacher.deparments ?? [])
			.map((department: IUserDepartment) => getLocaleText(department.name, locale))
			.filter(Boolean),
	}))

	return (
		<section className='mx-auto w-full max-w-6xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>
			<RatingNav
				labels={{
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

			{/* ГРАФИК РАСПРЕДЕЛЕНИЯ */}
			<Card>
				<CardHeader>
					<CardTitle>{t.distribution}</CardTitle>
				</CardHeader>
				<CardContent>
					<RatingDistributionChart
						barColors={RATING_COLORS}
						data={chartData}
						valueLabel={t.points}
						onPointClick={(teacher) => {
							if (!teacher.keycloakId) return

							router.push(`/users/${teacher.keycloakId}?tab=kpi`)
						}}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t.teacherTableTitle}</CardTitle>
				</CardHeader>
				<CardContent className='p-0'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-12 text-center'>#</TableHead>
								<TableHead className='w-16 text-right'>{t.points}</TableHead>
								<TableHead>{t.teacher}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedTeachers.map((teacher, index) => {
								const departmentLabel = (teacher.departments ?? teacher.deparments ?? [])
									.map((department: IUserDepartment) => getLocaleText(department.name, locale))
									.filter(Boolean)
									.join(', ')
								const color = RATING_COLORS[index % RATING_COLORS.length]
								const rowStyle = {
									backgroundColor: `color-mix(in oklch, ${color} 10%, var(--background))`,
									borderLeftColor: color,
									color,
								}

								return (
									<TableRow key={teacher.keycloakId} className='border-l-4 transition-colors' style={rowStyle}>
										<TableCell className='w-12 text-center font-semibold'>{index + 1}</TableCell>
										<TableCell className='w-16 text-right font-semibold whitespace-nowrap'>
											{teacher.totalPoints ?? 0}
										</TableCell>
										<TableCell className='py-4'>
											<div className='space-y-1'>
												<Link
													className='block text-base font-medium hover:underline'
													href={`/users/${teacher.keycloakId}?tab=kpi`}
												>
													{teacher.firstName} {teacher.lastName}
												</Link>
												{departmentLabel ? (
													<p className='truncate text-xs text-muted-foreground'>{departmentLabel}</p>
												) : null}
											</div>
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</section>
	)
}

export default withRole(RatingStatsPage, [RoleEnum.METHODIST])
