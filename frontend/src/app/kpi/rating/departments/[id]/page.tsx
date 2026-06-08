'use client'

import type { CSSProperties } from 'react'
import { useMemo } from 'react'

import Link from 'next/link'
import { useParams } from 'next/navigation'

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

import { RatingNav } from '../../components/rating-nav'
import localeDictionary from './locale.json'

const TEACHER_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
] as const

const getTeacherColor = (index: number) => TEACHER_COLORS[index % TEACHER_COLORS.length]

const getTeacherRowStyle = (color: string): CSSProperties => ({
	backgroundColor: `color-mix(in oklch, ${color} 10%, var(--background))`,
	borderLeftColor: color,
})

function RatingDepartmentPage() {
	const locale = useLocaleStore((state) => state.locale)
	const params = useParams<{ id: string }>()
	const departmentId = typeof params?.id === 'string' ? params.id : ''
	const t = getUILocaleSection(localeDictionary, locale)

	const { data: department, isLoading } = useQuery({
		...services.statistics.getTeachersByDepartmentOptions(departmentId),
		enabled: Boolean(departmentId),
	})

	const sortedTeachers = useMemo(() => {
		if (!department?.teachers?.length) return []

		return [...department.teachers].sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
	}, [department])

	if (isLoading || (departmentId && department === undefined)) {
		return <Loader fullScreen type='default' />
	}

	if (!department) {
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

	const departmentTitle = getLocaleText(department.name, locale)

	return (
		<section className='mx-auto w-full max-w-6xl p-6 space-y-6'>
			<PageTitle description={t.description}>{departmentTitle}</PageTitle>
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
						<CardTitle>{departmentTitle}</CardTitle>
						<CardDescription>
							{department.teachersCount} {t.teachersCount}
						</CardDescription>
					</div>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t.tableTitle}</CardTitle>
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
								const color = getTeacherColor(index)
								const departmentLabel = (teacher.departments ?? teacher.deparments ?? [])
									.map((item: IUserDepartment) => getLocaleText(item.name, locale))
									.filter(Boolean)
									.join(', ')

								return (
									<TableRow
										key={teacher.keycloakId}
										className='border-l-4 transition-colors hover:bg-muted/40'
										style={getTeacherRowStyle(color)}
									>
										<TableCell className='w-12 text-center font-semibold'>{index + 1}</TableCell>
										<TableCell className='w-16 whitespace-nowrap text-right font-semibold'>
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

export default withRole(RatingDepartmentPage, [RoleEnum.METHODIST])
