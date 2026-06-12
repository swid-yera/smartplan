'use client'

import type { CSSProperties } from 'react'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Loader, PageTitle, UserTypeBadge, withPermission } from '@components'
import { getLocaleText, getUILocaleSection, getUserTotalPoints, normalizeTotalPoints, prettifyPhone } from '@helpers'
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
import { PermissionCodeEnum } from '@types'
import { Mail, Phone } from 'lucide-react'

import { RatingNav } from '../../kpi/rating/components/rating-nav'
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

const Page = () => {
	const { id } = useParams<{ id: string }>()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const departmentId = id || ''

	const { data: department, isLoading: isDepartmentLoading } = useQuery({
		...services.statistics.getTeachersByDepartmentOptions(departmentId),
		enabled: !!id,
	})
	const {
		data: teachersData,
		isLoading: isTeachersLoading,
		isFetching: isTeachersFetching,
		isRefetching: isTeachersRefetching,
	} = useQuery({
		...services.user.getAllOptions({
			currentPage: 1,
			departmentId,
			pageSize: 100,
			search: '',
			sort: 'desc',
		}),
		enabled: !!id,
	})

	if (isDepartmentLoading || isTeachersLoading) {
		return <Loader type='data' />
	}

	if (!department) {
		return <p className='p-6 text-center text-muted-foreground'>Отделение не найдено</p>
	}

	const teachers = teachersData?.data ?? department.teachers
	const sortedTeachers = [...teachers].sort((a, b) => getUserTotalPoints(b) - getUserTotalPoints(a))
	const departmentTitle = getLocaleText(department.name, locale)
	const teachersCount = teachersData?.meta.total ?? department.teachersCount

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
							{t.teachersCount} {teachersCount}
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
								<TableHead className='w-12 text-center'>{t.table.index}</TableHead>
								<TableHead className='min-w-40'>{t.table.username}</TableHead>
								<TableHead className='w-32'>{t.table.types}</TableHead>
								<TableHead className='min-w-56'>{t.table.contacts}</TableHead>
								<TableHead className='w-24 text-right'>{t.table.points}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedTeachers.length > 0 ? (
								sortedTeachers.map((teacher, index) => {
									const color = getTeacherColor(index)
									const displayName =
										[teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() ||
										teacher.username ||
										'—'
									const totalPoints = normalizeTotalPoints(getUserTotalPoints(teacher), locale)
									const email = teacher.email?.trim() || ''
									const phone = teacher.phone ? prettifyPhone(teacher.phone) : ''
									const contacts = [email, phone].filter(Boolean)

									return (
										<TableRow
											key={teacher.keycloakId}
											className='border-l-4 transition-colors hover:bg-muted/40'
											style={getTeacherRowStyle(color)}
										>
											<TableCell className='w-12 text-center font-semibold'>{index + 1}</TableCell>
											<TableCell className='font-medium'>
												<Link
													className='block truncate hover:underline'
													href={`/users/${teacher.keycloakId}?tab=kpi`}
												>
													<p>{displayName}</p>
													<p className='truncate'>{teacher.username || '—'}</p>
												</Link>
											</TableCell>
											<TableCell>
												<UserTypeBadge locale={locale} size='lg' userType={teacher.userType} />
											</TableCell>
											<TableCell className='py-4'>
												<div className='space-y-1 text-sm'>
													{contacts.length > 0 ? (
														<>
															{email ? (
																<div className='flex min-w-0 items-center gap-2'>
																	<Mail className='h-4 w-4 shrink-0 text-muted-foreground' />
																	<span className='truncate'>{email}</span>
																</div>
															) : null}
															{phone ? (
																<div className='flex min-w-0 items-center gap-2'>
																	<Phone className='h-4 w-4 shrink-0 text-muted-foreground' />
																	<span className='truncate'>{phone}</span>
																</div>
															) : null}
														</>
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
												</div>
											</TableCell>

											<TableCell className='whitespace-nowrap text-right font-semibold'>
												{totalPoints}
											</TableCell>
										</TableRow>
									)
								})
							) : (
								<TableRow>
									<TableCell className='py-10 text-center text-muted-foreground' colSpan={6}>
										{isTeachersFetching || isTeachersRefetching ? <Loader type='data' /> : t.emptyTitle}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</section>
	)
}

export default withPermission(Page, [PermissionCodeEnum.KPI_MANAGE])
