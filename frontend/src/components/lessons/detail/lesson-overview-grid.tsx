'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'

import { getLocaleText, getUILocaleSection, normalizeTopicType } from '@helpers'
import { cn } from '@lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import type { ILesson, Locale, TopicTypeEnum } from '@types'
import { FileText, Folder, GraduationCap, Grid2X2, type LucideIcon, Phone, Timer, UserRound } from 'lucide-react'

import { formatDate, formatDateOnly } from './lesson-page.utils'
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
	const t = getUILocaleSection(localeDictionary, lessonLocale)

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
						empty={t.empty}
						icon={<Folder className='h-4 w-4' />}
						label={t.rup}
						value={getLocaleText(lesson.rup_name, lessonLocale)}
					/>
					<InfoRow
						empty={t.empty}
						icon={<Grid2X2 className='h-4 w-4' />}
						label={t.discipline}
						value={getLocaleText(lesson.discipline_name, lessonLocale)}
					/>
					<InfoRow
						empty={t.empty}
						icon={<FileText className='h-4 w-4' />}
						label={t.topic}
						value={getLocaleText(lesson.topic_name, lessonLocale)}
					/>
					<div className='grid gap-5 md:grid-cols-2'>
						<InfoRow
							empty={t.empty}
							icon={<LessonTypeIcon className='h-4 w-4' />}
							label={t.lessonType}
							value={normalizeTopicType(resolvedTopicTypeLabel, lessonLocale)}
						/>
						<InfoRow
							empty={t.empty}
							icon={<Timer className='h-4 w-4' />}
							label={t.date}
							value={formatDateOnly(lesson.event_date, lessonLocale)}
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
							empty={t.empty}
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
							empty={t.empty}
							icon={<Phone className='h-4 w-4' />}
							label={t.phone}
							value={lesson.teacher?.phone || t.empty}
						/>
						<InfoRow
							empty={t.empty}
							icon={<GraduationCap className='h-4 w-4' />}
							label={t.group}
							value={groupName || t.empty}
						/>
						<Row
							empty={t.empty}
							label={t.qualification}
							value={getLocaleText(lesson.group?.qualification, lessonLocale) || t.empty}
						/>
						<Row
							empty={t.empty}
							label={t.specialty}
							value={getLocaleText(lesson.group?.specialty, lessonLocale) || t.empty}
						/>
						<Row
							empty={t.empty}
							label={t.signatureKey}
							value={lesson.signatureArtifact?.keyId || t.empty}
						/>
					</div>

					<div className='grid gap-5'>
						<Row empty={t.empty} label={t.createdAt} value={formatDate(lesson.created_at, lessonLocale)} />
						<Row empty={t.empty} label={t.updatedAt} value={formatDate(lesson.updated_at, lessonLocale)} />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function Row({ label, value, empty }: { label: string; value: string | number; empty: string }) {
	return (
		<div className='grid gap-1'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='text-sm font-medium leading-snug text-foreground'>{value || empty}</p>
		</div>
	)
}

function InfoRow({ label, value, icon, empty }: { label: string; value: ReactNode; icon: ReactNode; empty: string }) {
	return (
		<div className='grid gap-1'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='inline-flex items-start gap-2 text-sm font-medium leading-snug text-foreground'>
				<span className='mt-0.5 text-primary'>{icon}</span>
				<span>{value || empty}</span>
			</p>
		</div>
	)
}
