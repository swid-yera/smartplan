'use client'

import { useMemo } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { getLocaleText } from '@helpers'
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
import type { IUser, IUserDepartment, Locale } from '@types'

import { RatingDistributionChart } from '../components/rating-distribution-chart'
import { RatingNav } from '../components/rating-nav'

const RATING_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
] as const

interface IProps {
	locale: Locale
	teachers: IUser[]
	t: {
		averageTitle: string
		departments: string
		description: string
		distribution: string
		emptyDescription: string
		emptyTitle: string
		headerDescription: string
		headerTitle: string
		points: string
		stats: string
		teacher: string
		teacherTableTitle: string
		title: string
		top20: string
	}
}

export const RatingStatsClient = ({ locale, teachers, t }: IProps) => {
	const router = useRouter()

	const sortedTeachers = useMemo(() => {
		return [...teachers].sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
	}, [teachers])

	const averagePoints =
		sortedTeachers.reduce((sum, teacher) => sum + (teacher.totalPoints ?? 0), 0) / (sortedTeachers.length || 1)

	const chartData = sortedTeachers.map((teacher) => ({
		keycloakId: teacher.keycloakId,
		name: `${teacher.firstName} ${teacher.lastName}`.trim(),
		value: teacher.totalPoints ?? 0,
		departments: (teacher.departments ?? [])
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

			<Card>
				<CardHeader>
					<div>
						<CardTitle>{t.headerTitle}</CardTitle>
						<CardDescription>{t.headerDescription}</CardDescription>
					</div>
				</CardHeader>
			</Card>

			<Card>
				<CardContent className='text-center'>
					<p className='text-muted-foreground'>{t.averageTitle}</p>
					<p className='text-3xl font-bold'>{averagePoints.toFixed(1)}</p>
				</CardContent>
			</Card>

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
								const departmentLabel = (teacher.departments ?? [])
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
