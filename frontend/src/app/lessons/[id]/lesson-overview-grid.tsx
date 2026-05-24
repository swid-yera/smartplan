'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'

import { getUILocaleSection, normalizeTopicType } from '@helpers'
import { cn } from '@lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ILesson, TopicTypeEnum } from '@types'
import { FileText, Folder, GraduationCap, Grid2X2, type LucideIcon, Phone, Timer, UserRound } from 'lucide-react'

import { formatDate } from './lesson-page.utils'
import localeDictionary from './locale.json'

type IProps = {
	cardClassName: string
	groupName: string
	lesson: ILesson
	lessonTypeIcon: LucideIcon
	resolvedTopicTypeLabel: TopicTypeEnum
	teacherId: string
	teacherName: string
}

export function LessonOverviewGrid({
	cardClassName,
	groupName,
	lesson,
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
						Основная информация
					</CardTitle>
					<CardDescription>{t.overviewDescription}</CardDescription>
				</CardHeader>
				<CardContent className='space-y-5'>
					<InfoRow icon={<Folder className='h-4 w-4' />} label='РУП' value={lesson.rup_name} />
					<InfoRow icon={<Grid2X2 className='h-4 w-4' />} label='Дисциплина' value={lesson.discipline_name} />
					<InfoRow icon={<FileText className='h-4 w-4' />} label='Тема урока' value={lesson.topic_name} />
					<div className='grid md:grid-cols-2 gap-5'>
						<InfoRow
							icon={<LessonTypeIcon className='h-4 w-4' />}
							label='Тип занятия'
							value={normalizeTopicType(resolvedTopicTypeLabel)}
						/>
						<InfoRow
							icon={<Timer className='h-4 w-4' />}
							label='Дата проведения'
							value={formatDate(lesson.event_date)}
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
						Преподаватель
					</CardTitle>
					<CardDescription>{t.responsibleDescription}</CardDescription>
				</CardHeader>
				<CardContent className='w-full h-full flex flex-col gap-8 justify-between'>
					<div className='grid gap-5'>
						<InfoRow
							icon={<UserRound className='h-4 w-4' />}
							label='ФИО'
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
							label='Телефон'
							value={lesson.teacher?.phone || 'Пусто'}
						/>
						<InfoRow icon={<GraduationCap className='h-4 w-4' />} label='Группа' value={groupName} />
						<Row label='Квалификация' value={lesson.group?.qualification || 'Пусто'} />
						<Row label='Специальность' value={lesson.group?.specialty || 'Пусто'} />
					</div>

					<div className='grid gap-5'>
						<Row label='Создано' value={formatDate(lesson.created_at)} />
						<Row label='Обновлено' value={formatDate(lesson.updated_at)} />
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
