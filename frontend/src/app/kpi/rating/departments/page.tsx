'use client'

import Link from 'next/link'

import { Loader, PageTitle, withRole } from '@components'
import { getLocaleText, getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum } from '@types'

import { RatingDistributionChart } from '../components/rating-distribution-chart'
import { RatingNav } from '../components/rating-nav'
import localeDictionary from './locale.json'

const DEPARTMENT_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
] as const

const getDepartmentColor = (index: number) => DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]

const getDepartmentStyle = (index: number) => {
	const color = getDepartmentColor(index)

	return {
		backgroundColor: `color-mix(in oklch, ${color} 10%, var(--background))`,
		borderLeftColor: color,
		color,
	}
}

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { data: departments, isLoading } = useQuery({
		...services.award.getAllDepartmentsOptions(),
	})

	if (isLoading) {
		return <Loader type='data' />
	}

	const sortedDepartments = [...(departments || [])].sort((a, b) => b.totalPoints - a.totalPoints)

	if (sortedDepartments.length === 0) {
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

	const topDepartments = sortedDepartments.slice(0, 10)
	const chartData = sortedDepartments.map((department) => ({
		name: getLocaleText(department.name, locale),
		value: department.totalPoints,
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
				<CardHeader>
					<CardTitle>{t.topDepartments}</CardTitle>
				</CardHeader>
				<CardContent className='space-y-2'>
					{topDepartments.map((department, index) => (
						<div
							key={department.keycloakId}
							className='flex items-center justify-between rounded-lg border border-border border-l-4 p-3 transition-colors'
							style={getDepartmentStyle(index)}
						>
							<div>
								<Link
									className='font-medium text-foreground hover:underline'
									href={`/kpi/rating/departments/${department.keycloakId}`}
								>
									{index + 1}. {getLocaleText(department.name, locale)}
								</Link>
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
					<RatingDistributionChart
						barColors={DEPARTMENT_COLORS}
						data={chartData}
						height={320}
						valueLabel={t.points}
					/>
				</CardContent>
			</Card>
		</section>
	)
}

export default withRole(Page, [RoleEnum.METHODIST])
