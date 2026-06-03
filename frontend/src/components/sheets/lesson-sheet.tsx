'use client'

import type { FC, ReactNode } from 'react'
import { useRef } from 'react'

import Link from 'next/link'

import { getLessonTypeLabels, getLocaleText } from '@helpers'
import {
	Button,
	Separator,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { ILesson } from '@types'
import { BookOpen, FileText, Files, Folder, GraduationCap, Link2, ListChecks, Users } from 'lucide-react'

import localeDictionary from './locale.json'

interface ILessonSheet {
	lesson: ILesson | null
	onSelect: (lesson: ILesson | null) => void
}

const formatDate = (value: string | undefined, locale: 'ru' | 'kk', emptyText: string): string => {
	if (!value) return emptyText

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) return emptyText

	return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(date)
}

const renderLocaleValue = (value: string | undefined, fallback: string) => value?.trim() || fallback

const resolveProgressValue = (
	item: {
		firstTime?: number[] | string[]
		secondTime?: number[] | string[]
		thirdTime?: number[] | string[]
		first_time?: number[] | string[]
		second_time?: number[] | string[]
		third_time?: number[] | string[]
	},
	key: 'firstTime' | 'secondTime' | 'thirdTime',
	snakeKey: 'first_time' | 'second_time' | 'third_time',
): number => {
	const value = item[key] ?? item[snakeKey]

	if (Array.isArray(value)) {
		return Number(value[0]) || 0
	}

	return Number(value) || 0
}

export const LessonSheet: FC<ILessonSheet> = ({ lesson, onSelect }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const openPageButtonRef = useRef<HTMLAnchorElement | null>(null)
	const lessonTypeLabels = getLessonTypeLabels(locale)
	const progress = lesson?.lesson_progress ?? []
	const internetResources = lesson?.internet_resources ?? []
	const technicalResources = lesson?.technical_resources ?? []

	return (
		<Sheet open={!!lesson} onOpenChange={(open) => !open && onSelect(null)}>
			<SheetContent
				className='flex w-full flex-col sm:max-w-lg'
				onOpenAutoFocus={(event) => {
					event.preventDefault()
					openPageButtonRef.current?.focus()
				}}
			>
				{lesson ? (
					<>
						<SheetHeader className='px-4'>
							<SheetTitle className='mt-2 flex flex-wrap items-center gap-2'>
								<span className='line-clamp-2'>{getLocaleText(lesson.topic_name, locale) || t.empty}</span>
								<span className='rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary'>
									{lessonTypeLabels[lesson.type] ?? lesson.type}
								</span>
							</SheetTitle>
							<SheetDescription>{t.lesson.description}</SheetDescription>
						</SheetHeader>

						<div className='flex-1 overflow-y-auto px-4'>
							<div className='grid auto-rows-min gap-6 pb-4'>
								<div className='space-y-3'>
									<h4 className='flex items-center text-sm font-medium text-muted-foreground'>
										<BookOpen className='mr-2 h-4 w-4' /> {t.lesson.main}
									</h4>

									<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
										<p className='font-medium'>{t.lesson.topic}:</p>
										<p className='break-words'>{getLocaleText(lesson.topic_name, locale) || t.empty}</p>

										<p className='font-medium'>{t.lesson.planNumber}:</p>
										<p>{lesson.plan_number ?? t.empty}</p>

										<p className='font-medium'>{t.lesson.type}:</p>
										<p>{lessonTypeLabels[lesson.type] ?? lesson.type}</p>

										<p className='font-medium'>{t.lesson.date}:</p>
										<p>{formatDate(lesson.event_date, locale, t.empty)}</p>

										<p className='font-medium'>{t.lesson.rup}:</p>
										<p>{renderLocaleValue(getLocaleText(lesson.rup_name, locale), t.empty)}</p>

										<p className='font-medium'>{t.lesson.discipline}:</p>
										<p>{renderLocaleValue(getLocaleText(lesson.discipline_name, locale), t.empty)}</p>

										<p className='font-medium'>{t.lesson.group}:</p>
										<p>{lesson.group?.name || lesson.group_id || t.empty}</p>
									</div>
								</div>

								<Separator />

								<div className='space-y-3'>
									<h4 className='flex items-center text-sm font-medium text-muted-foreground'>
										<Users className='mr-2 h-4 w-4' /> {t.lesson.teacher}
									</h4>

									<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
										<p className='font-medium'>{t.lesson.teacherName}:</p>
										<p>
											{lesson.teacher?.keycloakId ? (
												<Link
													className='font-semibold text-primary hover:underline'
													href={`/users/${lesson.teacher.keycloakId}`}
												>
													{lesson.teacher.firstName} {lesson.teacher.lastName}
												</Link>
											) : (
												`${lesson.teacher?.firstName || ''} ${lesson.teacher?.lastName || ''}`.trim() ||
												t.empty
											)}
										</p>

										<p className='font-medium'>{t.lesson.phone}:</p>
										<p>{lesson.teacher?.phone || t.empty}</p>
									</div>
								</div>

								<Separator />

								<div className='space-y-3'>
									<h4 className='flex items-center text-sm font-medium text-muted-foreground'>
										<FileText className='mr-2 h-4 w-4' /> {t.lesson.textSections}
									</h4>

									<div className='space-y-3 text-sm'>
										<div className='grid grid-cols-[1fr_2fr] gap-2'>
											<p className='font-medium'>{t.lesson.goals}:</p>
											<p className='whitespace-pre-wrap'>{getLocaleText(lesson.goals, locale) || t.empty}</p>
										</div>
										<div className='grid grid-cols-[1fr_2fr] gap-2'>
											<p className='font-medium'>{t.lesson.tasks}:</p>
											<p className='whitespace-pre-wrap'>{getLocaleText(lesson.tasks, locale) || t.empty}</p>
										</div>
										<div className='grid grid-cols-[1fr_2fr] gap-2'>
											<p className='font-medium'>{t.lesson.expected}:</p>
											<p className='whitespace-pre-wrap'>
												{getLocaleText(lesson.expected, locale) || t.empty}
											</p>
										</div>
									</div>
								</div>

								<Separator />

								<div className='space-y-3'>
									<h4 className='flex items-center text-sm font-medium text-muted-foreground'>
										<ListChecks className='mr-2 h-4 w-4' /> {t.lesson.progress}
									</h4>

									<div className='space-y-3'>
										{progress.length ? (
											progress.map((item, index) => (
												<div
													key={item.id || `${lesson.id}-progress-${index}`}
													className='rounded-md border p-3'
												>
													<p className='text-sm font-medium'>
														{getLocaleText(item.name, locale) || t.empty}
													</p>
													<p className='mt-1 text-xs text-muted-foreground'>
														{resolveProgressValue(item, 'firstTime', 'first_time')}/
														{resolveProgressValue(item, 'secondTime', 'second_time')}/
														{resolveProgressValue(item, 'thirdTime', 'third_time')}
														{t.lesson.minutes}
													</p>
													{item.content?.length ? (
														<div className='mt-2 space-y-1 text-sm'>
															{item.content.map((line, lineIndex) => (
																<p key={`${item.id || lesson.id}-content-${lineIndex}`}>
																	{getLocaleText(line, locale) || t.empty}
																</p>
															))}
														</div>
													) : (
														<p className='mt-2 text-sm text-muted-foreground'>{t.empty}</p>
													)}
												</div>
											))
										) : (
											<p className='text-sm text-muted-foreground'>{t.lesson.progressEmpty}</p>
										)}
									</div>
								</div>

								<Separator />

								<div className='space-y-3'>
									<h4 className='flex items-center text-sm font-medium text-muted-foreground'>
										<Files className='mr-2 h-4 w-4' /> {t.lesson.resources}
									</h4>

									<div className='space-y-4'>
										<ResourceBlock
											empty={t.lesson.resourcesEmpty}
											icon={<Link2 className='h-4 w-4' />}
											items={internetResources}
											locale={locale}
											title={t.lesson.internetResources}
										/>
										<ResourceBlock
											empty={t.lesson.resourcesEmpty}
											icon={<Folder className='h-4 w-4' />}
											items={technicalResources}
											locale={locale}
											title={t.lesson.technicalResources}
										/>
									</div>
								</div>

								{lesson.file_url ? (
									<>
										<Separator />
										<div className='space-y-2 text-sm'>
											<h4 className='flex items-center text-sm font-medium text-muted-foreground'>
												<GraduationCap className='mr-2 h-4 w-4' /> {t.lesson.file}
											</h4>
											<Link
												className='break-all text-primary hover:underline'
												href={lesson.file_url}
												target='_blank'
											>
												{lesson.file_url}
											</Link>
										</div>
									</>
								) : null}
							</div>
						</div>

						<SheetFooter className='mt-0 shrink-0 border-t bg-background px-4 py-4'>
							<Button asChild className='w-full'>
								<Link ref={openPageButtonRef} href={`/lessons/${lesson.id}`}>
									{t.openFullPage}
								</Link>
							</Button>
							<SheetClose asChild>
								<Button variant='outline'>{t.close}</Button>
							</SheetClose>
						</SheetFooter>
					</>
				) : null}
			</SheetContent>
		</Sheet>
	)
}

type ResourceBlockProps = {
	empty: string
	icon: ReactNode
	items: ILesson['internet_resources'] | ILesson['technical_resources']
	locale: 'ru' | 'kk'
	title: string
}

function ResourceBlock({ empty, icon, items, locale, title }: ResourceBlockProps) {
	return (
		<div className='space-y-2'>
			<h5 className='flex items-center text-xs font-medium uppercase tracking-wide text-muted-foreground'>
				{icon}
				<span className='ml-2'>{title}</span>
			</h5>

			<div className='space-y-2 rounded-md border p-3'>
				{items.length ? (
					items.map((item, index) => (
						<div key={item.id || `${title}-${index}`} className='space-y-1'>
							<p className='text-sm font-medium'>{getLocaleText(item.name, locale) || empty}</p>
							{item.link ? (
								<Link
									className='break-all text-xs text-primary hover:underline'
									href={item.link}
									target='_blank'
								>
									{item.link}
								</Link>
							) : (
								<p className='text-xs text-muted-foreground'>{empty}</p>
							)}
						</div>
					))
				) : (
					<p className='text-sm text-muted-foreground'>{empty}</p>
				)}
			</div>
		</div>
	)
}
