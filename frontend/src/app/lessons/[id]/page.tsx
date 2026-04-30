'use client'

import { type ReactNode } from 'react'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'

import { Loader, PageTitle } from '@components'
import { normalizeLessonType } from '@helpers'
import { services } from '@services'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { ILessonResource } from '@types'
import {
	Calendar,
	FileDown,
	FileText,
	Folder,
	GraduationCap,
	Grid2X2,
	Link2,
	ListChecks,
	Phone,
	Target,
	Trophy,
	UserRound,
} from 'lucide-react'

export default function LessonPage() {
	const params = useParams<{ id: string }>()
	const { authLoading, user } = useAuthStore()

	const { data: lesson, isLoading } = useQuery({
		...services.lesson.getByIdOptions(params.id),
		enabled: !!params.id,
	})

	if (authLoading || isLoading) return <Loader />
	if (!user || !lesson) return notFound()

	const teacherName =
		[lesson.teacher?.lastName, lesson.teacher?.firstName].filter(Boolean).join(' ') ||
		lesson.teacher?.username ||
		lesson.teacher_id ||
		'Пусто'

	return (
		<section className='mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8'>
			<PageTitle
				actions={
					lesson.file_url ? (
						<Button asChild variant='outline'>
							<Link href={lesson.file_url} rel='noopener noreferrer' target='_blank'>
								<FileDown className='mr-2 h-4 w-4' />
								Открыть файл
							</Link>
						</Button>
					) : undefined
				}
				backHref='/lessons/my'
				description='Детальная информация по уроку'
			>
				{lesson.topic_name}
			</PageTitle>

			<div className='grid gap-6 xl:grid-cols-3'>
				<div className='space-y-6 xl:col-span-2'>
					<Card>
						<CardHeader>
							<CardTitle>Основная информация</CardTitle>
							<CardDescription>Ключевые сведения о занятии, теме и формате</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid gap-5 sm:grid-cols-2'>
								<InfoRow icon={<Folder className='h-4 w-4' />} label='РУП' value={lesson.rup_name} />
								<InfoRow
									icon={<Grid2X2 className='h-4 w-4' />}
									label='Дисциплина'
									value={lesson.discipline_name}
								/>
								<InfoRow icon={<FileText className='h-4 w-4' />} label='Тема урока' value={lesson.topic_name} />
								<Row label='Тип занятия' value={normalizeLessonType(lesson.type)} />
								<Row label='Дата проведения' value={formatDate(lesson.event_date)} />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Группа</CardTitle>
							<CardDescription>Учебная группа и квалификационные данные</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<InfoRow
								icon={<GraduationCap className='h-4 w-4' />}
								label='Название'
								value={lesson.group?.name || lesson.group_id || 'Пусто'}
							/>
							<Row label='Квалификация' value={lesson.group?.qualification || 'Пусто'} />
							<Row label='Специальность' value={lesson.group?.specialty || 'Пусто'} />
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Преподаватель</CardTitle>
						<CardDescription>Ответственный за проведение занятия</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<InfoRow icon={<UserRound className='h-4 w-4' />} label='ФИО' value={teacherName} />
						<InfoRow
							icon={<Phone className='h-4 w-4' />}
							label='Телефон'
							value={lesson.teacher?.phone || 'Пусто'}
						/>
						<InfoRow
							icon={<Calendar className='h-4 w-4' />}
							label='Логин'
							value={lesson.teacher?.username || 'Пусто'}
						/>
						<Row label='Создано' value={formatDate(lesson.created_at)} />
						<Row label='Обновлено' value={formatDate(lesson.updated_at)} />
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 xl:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Интернет-ресурсы</CardTitle>
						<CardDescription>Ссылки и онлайн-материалы к занятию</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<ResourceList items={lesson.internet_resources} title='Интернет-ресурсы' />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Технические ресурсы</CardTitle>
						<CardDescription>Оборудование и локальные материалы</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<ResourceList items={lesson.technical_resources} title='Технические ресурсы' />
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 xl:grid-cols-3'>
				<Card className='lg:col-span-1'>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2'>
							<Target className='h-5 w-5 text-primary' />
							Цели
						</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7'>
						{lesson.goals || 'Пусто'}
					</CardContent>
				</Card>
				<Card className='lg:col-span-1'>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2'>
							<ListChecks className='h-5 w-5 text-primary' />
							Задачи
						</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7'>
						{lesson.tasks || 'Пусто'}
					</CardContent>
				</Card>
				<Card className='lg:col-span-1'>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2'>
							<Trophy className='h-5 w-5 text-primary' />
							Ожидаемые результаты
						</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7'>
						{lesson.expected || 'Пусто'}
					</CardContent>
				</Card>
			</div>
		</section>
	)
}

function formatDate(value?: string | null) {
	if (!value) return 'Пусто'

	const parsed = new Date(value)

	if (Number.isNaN(parsed.getTime())) return value

	return new Intl.DateTimeFormat('ru-KZ', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(parsed)
}

function Row({ label, value }: { label: string; value: string | number }) {
	return (
		<div>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='break-all text-sm font-medium'>{value || 'Пусто'}</p>
		</div>
	)
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
	return (
		<div>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='inline-flex items-center gap-2 break-all text-sm font-medium'>
				{icon}
				{value || 'Пусто'}
			</p>
		</div>
	)
}

function ResourceList({ title, items }: { title: string; items: ILessonResource[] }) {
	return (
		<div className='space-y-2'>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{title}</p>
			<div className='max-h-56 overflow-auto rounded-md border p-3'>
				{items.length ? (
					<ul className='space-y-2'>
						{items.map((item, index) => (
							<li key={item.id} className='flex items-start gap-2'>
								<Badge className='mt-0.5' variant='secondary'>
									{index + 1}
								</Badge>
								<div className='space-y-1 text-sm'>
									<p className='break-all font-medium'>{item.name || 'Без названия'}</p>
									{item.link ? (
										<Link
											className='inline-flex items-center gap-1 break-all text-primary hover:underline'
											href={item.link}
											rel='noopener noreferrer'
											target='_blank'
										>
											<Link2 className='h-3.5 w-3.5 shrink-0' />
											{item.link}
										</Link>
									) : (
										<p className='text-xs text-muted-foreground'>Ссылка не указана</p>
									)}
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className='text-sm text-muted-foreground'>Пусто</p>
				)}
			</div>
		</div>
	)
}
