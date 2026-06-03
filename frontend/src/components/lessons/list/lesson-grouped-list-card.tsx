'use client'

import { useState } from 'react'

import Link from 'next/link'

import {
	Badge,
	Button,
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
import type { TopicTypeEnum } from '@types'

import { TopicTypeBadge } from '../../badges/topic-type-badge'
import { LessonSheet } from '../../sheets/lesson-sheet'
import { Loader } from '../../ui/loader'
import { Pagination } from '../../ui/pagination'
import type { LessonListCardProps, LessonListGroup } from './lesson-list.types'

export function LessonGroupedListCard({
	currentPage,
	description,
	emptyState,
	groups,
	isLoading,
	labels,
	onPageChange,
	onPageSizeChange,
	pageSize,
	pageSizeOptions,
	totalPages,
	title,
}: LessonListCardProps) {
	const isExist = groups.length > 0 && !isLoading
	const [selectedLesson, setSelectedLesson] = useState<LessonListGroup['lessons'][number]['lesson'] | null>(null)

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description ? <CardDescription>{description}</CardDescription> : null}
				</CardHeader>
				<CardContent>
					<div className='relative min-w-0 overflow-x-auto'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-[96px]'>{labels.planNumber}</TableHead>
									<TableHead>{labels.topic}</TableHead>
									<TableHead>{labels.discipline}</TableHead>
									<TableHead>{labels.group}</TableHead>
									<TableHead>{labels.date}</TableHead>
									<TableHead className='text-right'>{labels.lessonType}</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									groups.map((group) => (
										<LessonGroupRows
											key={group.id}
											group={group}
											labels={labels}
											onRowSelect={setSelectedLesson}
										/>
									))
								) : (
									<TableRow>
										<TableCell className='h-44 text-center' colSpan={6}>
											{isLoading ? (
												<Loader
													className='flex flex-col items-center justify-center'
													fullScreen={false}
													type='data'
												/>
											) : (
												<div className='space-y-3'>
													<p className='text-base font-medium'>{emptyState.title}</p>
													<p className='text-sm text-muted-foreground'>{emptyState.description}</p>
													{emptyState.actionHref && emptyState.actionLabel ? (
														<Button asChild size='sm' variant='outline'>
															<Link href={emptyState.actionHref}>{emptyState.actionLabel}</Link>
														</Button>
													) : null}
												</div>
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>

				{totalPages > 1 ? (
					<div className='px-6 pb-6 pt-0'>
						<Pagination
							page={currentPage}
							pageSize={pageSize}
							pageSizeOptions={pageSizeOptions}
							totalPages={totalPages}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
						/>
					</div>
				) : null}
			</Card>

			<LessonSheet lesson={selectedLesson} onSelect={setSelectedLesson} />
		</>
	)
}

type LessonGroupRowsProps = {
	group: LessonListGroup
	labels: LessonListCardProps['labels']
	onRowSelect: (lesson: LessonListGroup['lessons'][number]['lesson']) => void
}

function LessonGroupRows({ group, labels, onRowSelect }: LessonGroupRowsProps) {
	return (
		<>
			<TableRow className='bg-muted/30'>
				<TableCell className='py-3' colSpan={6}>
					<div className='flex flex-wrap items-center gap-2'>
						<Badge variant='secondary'>{group.count}</Badge>
						<span className='text-sm font-semibold'>{group.title}</span>
					</div>
				</TableCell>
			</TableRow>

			{group.lessons.map((lesson) => {
				return (
					<TableRow
						key={lesson.id}
						className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70'
						role='button'
						tabIndex={0}
						onClick={() => onRowSelect(lesson.lesson)}
						onKeyDown={(event) => {
							if (event.key !== 'Enter' && event.key !== ' ') return
							event.preventDefault()
							onRowSelect(lesson.lesson)
						}}
					>
						<TableCell className='font-medium whitespace-nowrap'>{lesson.planNumber}</TableCell>
						<TableCell className='max-w-[320px] min-w-[240px] py-4'>
							<div className='space-y-1'>
								<Link
									className='inline-flex max-w-full rounded-sm font-medium leading-snug hover:text-primary hover:underline'
									href={`/lessons/${lesson.id}`}
									title={lesson.topic || labels.notSpecifiedFemale}
									onClick={(event) => event.stopPropagation()}
								>
									<span className='truncate'>{lesson.topic || labels.notSpecifiedFemale}</span>
								</Link>
								<p className='truncate text-sm text-muted-foreground' title={lesson.description}>
									{lesson.description}
								</p>
							</div>
						</TableCell>
						<TableCell className='max-w-[220px] min-w-[160px]'>
							<p className='truncate' title={lesson.discipline || labels.notSpecifiedFemale}>
								{lesson.discipline || labels.notSpecifiedFemale}
							</p>
						</TableCell>
						<TableCell className='max-w-[180px] min-w-[140px]'>
							<p className='truncate' title={lesson.group || labels.groupNotSpecified}>
								{lesson.group || labels.groupNotSpecified}
							</p>
						</TableCell>
						<TableCell className='whitespace-nowrap'>{lesson.date}</TableCell>
						<TableCell className='text-right'>
							<div className='inline-flex justify-end'>
								<TopicTypeBadge
									label={lesson.typeLabel}
									type={(lesson.type === 'PRACTICE' ? 'PRACTICAL' : 'COMBINED') as TopicTypeEnum}
								/>
							</div>
						</TableCell>
					</TableRow>
				)
			})}
		</>
	)
}
