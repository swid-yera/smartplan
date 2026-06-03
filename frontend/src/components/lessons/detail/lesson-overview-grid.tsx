'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'

import { getLocaleText, getUILocaleSection, normalizeTopicType } from '@helpers'
import { cn } from '@lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ILesson, TopicTypeEnum } from '@types'
import type { Locale } from '@types'
import { FileText, Folder, GraduationCap, Grid2X2, type LucideIcon, Phone, Timer, UserRound } from 'lucide-react'

import { formatDate } from './lesson-page.utils'
import localeDictionary from './locale.json'

type IProps = {
	cardClassName: string
	groupName: string
	lesson: ILesson
	lessonLocale: Locale
	lessonTypeIcon: LucideIcon
	resolvedTopicTypeLabel: TopicTypeEnum
	teacherId: string
	teacherName: string
}

export function LessonOverviewGrid({
	cardClassName,
	groupName,
	lesson,
	lessonLocale,
	lessonTypeIcon: LessonTypeIcon,
	resolvedTopicTypeLabel,
	teacherId,
	teacherName,
}: IProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<div className='grid gap-6 xl:grid-cols-3'>
			<Card className={cn(cardClassName, 'xl:col-span-2')}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<FileText className='h-4 w-4' />
						</span>
						{t.overviewTitle}
					</CardTitle>
					<CardDescription>{t.overviewDescription}</CardDescription>
				</CardHeader>
				<CardContent className='space-y-5'>
					<InfoRow
						icon={<Folder className='h-4 w-4' />}
						label={t.rup}
						value={getLocaleText(lesson.rup_name, lessonLocale)}
					/>
					<InfoRow
						icon={<Grid2X2 className='h-4 w-4' />}
						label={t.discipline}
						value={getLocaleText(lesson.discipline_name, lessonLocale)}
					/>
					<InfoRow
						icon={<FileText className='h-4 w-4' />}
						label={t.topic}
						value={getLocaleText(lesson.topic_name, lessonLocale)}
					/>
					<div className='grid gap-5 md:grid-cols-2'>
						<InfoRow
							icon={<LessonTypeIcon className='h-4 w-4' />}
							label={t.lessonType}
							value={normalizeTopicType(resolvedTopicTypeLabel)}
						/>
						<InfoRow
							icon={<Timer className='h-4 w-4' />}
							label={t.date}
							value={formatDate(lesson.event_date, lessonLocale)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className={cardClassName}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<UserRound className='h-4 w-4' />
						</span>
						{t.teacher}
					</CardTitle>
					<CardDescription>{t.responsibleDescription}</CardDescription>
				</CardHeader>
				<CardContent className='flex h-full w-full flex-col justify-between gap-8'>
					<div className='grid gap-5'>
						<InfoRow
							icon={<UserRound className='h-4 w-4' />}
							label={t.teacherName}
							value={
								teacherId ? (
									<Link
										className='transition-colors duration-150 hover:text-primary hover:underline'
										href={`/users/${teacherId}`}
									>
										{teacherName}
									</Link>
								) : (
									teacherName
								)
							}
						/>
						<InfoRow
							icon={<Phone className='h-4 w-4' />}
							label={t.phone}
							value={lesson.teacher?.phone || t.empty}
						/>
						<InfoRow icon={<GraduationCap className='h-4 w-4' />} label={t.group} value={groupName || t.empty} />
						<Row
							label={t.qualification}
							value={getLocaleText(lesson.group?.qualification, lessonLocale) || t.empty}
						/>
						<Row label={t.specialty} value={getLocaleText(lesson.group?.specialty, lessonLocale) || t.empty} />
					</div>

					<div className='grid gap-5'>
						<Row label={t.createdAt} value={formatDate(lesson.created_at, locale)} />
						<Row label={t.updatedAt} value={formatDate(lesson.updated_at, locale)} />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function Row({ label, value }: { label: string; value: string | number }) {
	return (
		<div className='grid gap-1'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='text-sm font-medium leading-snug text-foreground'>{value || 'Пусто'}</p>
		</div>
	)
}

function InfoRow({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
	return (
		<div className='grid gap-1'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='inline-flex items-start gap-2 text-sm font-medium leading-snug text-foreground'>
				<span className='mt-0.5 text-primary'>{icon}</span>
				<span>{value || 'Пусто'}</span>
			</p>
		</div>
	)
}
