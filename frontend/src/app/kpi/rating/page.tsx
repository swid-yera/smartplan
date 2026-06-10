'use client'

import type { CSSProperties } from 'react'

import Link from 'next/link'

import { Loader, PageTitle, withNavAccess } from '@components'
import { getLocaleText, getUILocaleSection, getUserTotalPoints, interpolateUILocaleText } from '@helpers'
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
import type { IDepartmentTopTeachersResponse } from '@types'
import { Sigma, Users2 } from 'lucide-react'

import { RatingNav } from './components/rating-nav'
import localeDictionary from './locale.json'

const RATING_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
] as const

const getDepartmentColor = (index: number) => RATING_COLORS[index % RATING_COLORS.length]

const getDepartmentStyle = (index: number): CSSProperties => {
	const color = getDepartmentColor(index)

	return {
		backgroundColor: `color-mix(in oklch, ${color} 10%, var(--background))`,
		borderLeftColor: color,
	}
}

const getTeacherRowStyle = (color: string): CSSProperties => ({
	backgroundColor: `color-mix(in oklch, ${color} 9%, var(--background))`,
	borderLeftColor: color,
})

type DepartmentWithTotalPoints = IDepartmentTopTeachersResponse & {
	totalPoints: number
}

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { data: departments, isLoading } = useQuery({
		...services.statistics.getTopTeachersByDepartmentOptions(),
	})

	if (isLoading) {
		return <Loader type='data' />
	}

	const departmentsWithTotalPoints: DepartmentWithTotalPoints[] = (departments || []).map((department) => ({
		...department,
		totalPoints: department.teachers
			.map((teacher) => getUserTotalPoints(teacher))
			.reduce((sum, points) => sum + points, 0),
	}))

	if (departmentsWithTotalPoints.length === 0) {
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

	return (
		<section className='mx-auto w-full max-w-6xl space-y-6 p-6'>
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

			<div className='space-y-4'>
				{departmentsWithTotalPoints.map((department, departmentIndex) => {
					const color = getDepartmentColor(departmentIndex)
					const topTeachersCount = department.teachers.length
					const style = getDepartmentStyle(departmentIndex)

					return (
						<Card key={department.keycloakId} className='overflow-hidden border-l-4' style={style}>
							<CardHeader className='space-y-4'>
								<div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
									<div className='space-y-3'>
										<div className='flex items-center gap-2'>
											<span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: color }} />
											<Link
												className='text-xl font-semibold text-foreground hover:underline'
												href={`/departments/${department.keycloakId}`}
											>
												{getLocaleText(department.name, locale)}
											</Link>
										</div>

										<div className='flex flex-wrap gap-2'>
											<div
												className='inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium'
												style={{ borderColor: color, color }}
											>
												<Users2 className='h-4 w-4' />
												{interpolateUILocaleText(t.departmentSummary.teachers, {
													current: topTeachersCount,
													total: department.teachersCount,
												})}
											</div>
											<div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm'>
												<Sigma className='h-4 w-4' />
												{interpolateUILocaleText(t.departmentSummary.pointsInline, {
													points: department.totalPoints,
												})}
											</div>
										</div>
									</div>
								</div>
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
										{department.teachers.map((teacher, teacherIndex) => (
											<TableRow
												key={teacher.keycloakId}
												className='border-l-4 transition-colors hover:bg-muted/40'
												style={getTeacherRowStyle(color)}
											>
												<TableCell className='w-12 text-center font-semibold'>{teacherIndex + 1}</TableCell>
												<TableCell className='w-16 whitespace-nowrap text-right font-semibold'>
													{getUserTotalPoints(teacher)}
												</TableCell>
												<TableCell className='py-4'>
													<Link
														className='block text-base font-medium hover:underline'
														href={`/users/${teacher.keycloakId}?tab=kpi`}
													>
														{teacher.firstName} {teacher.lastName}
													</Link>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					)
				})}
			</div>
		</section>
	)
}

export default withNavAccess(Page)
