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

import { UserTypeBadge } from '@components'
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
			<section className='mx-auto flex w-full max-w-6xl flex-col gap-4 p-6'>
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
		<section className='mx-auto flex w-full max-w-6xl flex-col gap-4 p-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>
			<RatingNav
				labels={{
					departments: t.departments,
					stats: t.stats,
					top20: t.top20,
				}}
			/>

			<Card className='overflow-hidden'>
				<CardHeader className='pb-3 pt-4'>
					<div className='flex flex-col gap-1'>
						<CardTitle className='text-lg'>{t.headerTitle}</CardTitle>
						<CardDescription className='text-sm'>{t.headerDescription}</CardDescription>
					</div>
				</CardHeader>
			</Card>

			<div className='flex flex-col gap-3'>
				{departmentsWithTotalPoints.map((department, departmentIndex) => {
					const color = getDepartmentColor(departmentIndex)
					const topTeachersCount = department.teachers.length
					const style = getDepartmentStyle(departmentIndex)

					return (
						<Card key={department.keycloakId} className='overflow-hidden border-l-4' style={style}>
							<CardHeader className='pb-3 pt-4'>
								<div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
									<div className='flex min-w-0 flex-1 flex-col gap-2'>
										<div className='flex min-w-0 items-center gap-2'>
											<span className='h-2 w-2 shrink-0 rounded-full' style={{ backgroundColor: color }} />
											<Link
												className='truncate text-base font-semibold text-foreground hover:underline'
												href={`/departments/${department.keycloakId}`}
											>
												{getLocaleText(department.name, locale)}
											</Link>
										</div>

										<div className='flex flex-wrap gap-1.5'>
											<div
												className='inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none'
												style={{ borderColor: color, color }}
											>
												<Users2 className='h-3.5 w-3.5' />
												{interpolateUILocaleText(t.departmentSummary.teachers, {
													current: topTeachersCount,
													total: department.teachersCount,
												})}
											</div>
										</div>
									</div>

									<div className='flex shrink-0 items-start lg:items-center lg:justify-end'>
										<div className='inline-flex flex-col items-end rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-primary shadow-sm'>
											<span className='text-[11px] font-medium uppercase tracking-wide text-primary/80'>
												{t.departmentSummary.pointsInline}
											</span>
											<div className='flex items-end gap-1.5'>
												<Sigma className='h-4 w-4 shrink-0' />
												<span className='text-3xl font-semibold leading-none tabular-nums'>
													{department.totalPoints}
												</span>
											</div>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className='p-0'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='w-12 text-center text-xs'>#</TableHead>
											<TableHead>{t.teacher}</TableHead>
											<TableHead className='w-36'>{t.type}</TableHead>
											<TableHead className='w-20 text-right text-xs'>{t.points}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{department.teachers.map((teacher, teacherIndex) => (
											<TableRow
												key={teacher.keycloakId}
												className='border-l-4 transition-colors hover:bg-muted/40'
												style={getTeacherRowStyle(color)}
											>
												<TableCell className='w-12 text-center text-sm font-semibold'>{teacherIndex + 1}</TableCell>
												<TableCell className='py-2.5'>
													<Link
														className='truncate text-sm font-medium hover:underline'
														href={`/users/${teacher.keycloakId}?tab=kpi`}
													>
														{teacher.firstName} {teacher.lastName}
													</Link>
												</TableCell>
												<TableCell className='py-2.5'>
													<div className='flex min-w-0 items-center'>
														<UserTypeBadge locale={locale} size='lg' userType={teacher.userType} />
													</div>
												</TableCell>
												<TableCell className='w-20 whitespace-nowrap text-right text-sm font-semibold'>
													{getUserTotalPoints(teacher)}
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
