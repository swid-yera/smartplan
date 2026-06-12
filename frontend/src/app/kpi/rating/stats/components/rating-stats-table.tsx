'use client'

import Link from 'next/link'

import { Badge, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shadcn'
import { type IUser, type Locale } from '@types'

import { DepartmentBadge, UserTypeBadge } from '@components'
import { getUserTotalPoints } from '@helpers'

import { RATING_COLORS, normalizeTeacherName } from '../rating-stats.utils'
import { type RatingStatsTexts } from '../rating-stats.types'

interface IProps {
	baseTeachersCount: number
	filteredTeachers: IUser[]
	locale: Locale
	t: Pick<RatingStatsTexts, 'emptyDescription' | 'emptyTitle' | 'noMatchesDescription' | 'noMatchesTitle' | 'tableDepartment' | 'tableIndex' | 'tableName' | 'tablePoints' | 'tableTitle' | 'tableType'>
}

export const RatingStatsTable = ({ baseTeachersCount, filteredTeachers, locale, t }: IProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.tableTitle}</CardTitle>
			</CardHeader>
			<CardContent className='p-0'>
				{filteredTeachers.length > 0 ? (
					<div className='overflow-x-auto'>
						<Table className='min-w-[860px]'>
							<TableHeader>
								<TableRow>
									<TableHead className='w-14 text-center'>{t.tableIndex}</TableHead>
									<TableHead>{t.tableName}</TableHead>
									<TableHead>{t.tableDepartment}</TableHead>
									<TableHead>{t.tableType}</TableHead>
									<TableHead className='w-28 text-right'>{t.tablePoints}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTeachers.map((teacher, index) => {
									const points = getUserTotalPoints(teacher)
									const rowColor = RATING_COLORS[index % RATING_COLORS.length]

									return (
										<TableRow
											key={teacher.keycloakId}
											className='border-l-4 transition-colors hover:bg-muted/30'
											style={{
												borderLeftColor: rowColor,
											}}
										>
											<TableCell className='text-center font-medium tabular-nums'>{index + 1}</TableCell>
											<TableCell className='min-w-0'>
												<Link
													className='block max-w-full truncate font-medium hover:underline'
													href={`/users/${teacher.keycloakId}?tab=kpi`}
												>
													{normalizeTeacherName(teacher)}
												</Link>
											</TableCell>
											<TableCell>
												{teacher.departments?.length ? (
													<DepartmentBadge departments={teacher.departments} locale={locale} size='sm' />
												) : (
													<Badge variant='outline'>—</Badge>
												)}
											</TableCell>
											<TableCell>
												<UserTypeBadge locale={locale} size='sm' userType={teacher.userType} />
											</TableCell>
											<TableCell className='text-right font-semibold tabular-nums'>{points}</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</div>
				) : (
					<div className='flex min-h-56 flex-col items-center justify-center gap-2 px-6 py-10 text-center'>
						<p className='text-base font-medium text-foreground'>
							{baseTeachersCount > 0 ? t.noMatchesTitle : t.emptyTitle}
						</p>
						<p className='max-w-md text-sm text-muted-foreground'>
							{baseTeachersCount > 0 ? t.noMatchesDescription : t.emptyDescription}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
