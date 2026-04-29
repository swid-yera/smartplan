'use client'

import { type ReactNode } from 'react'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'

import { Loader, PageTitle } from '@components'
import { normalizeLessonType } from '@helpers'
import { services } from '@services'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@shadcn'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { Calendar, FileDown, FileText, Folder, Grid2X2, UserRound } from 'lucide-react'

export default function LessonPage() {
	const params = useParams<{ id: string }>()
	const { authLoading, user } = useAuthStore()

	const { data: lesson, isLoading } = useQuery({
		...services.lesson.getByIdOptions(params.id),
		enabled: !!params.id,
	})

	if (authLoading || isLoading) return <Loader />
	if (!user || !lesson) return notFound()

	return (
		<section className='mx-auto w-full max-w-[1320px] p-4 sm:p-6 lg:p-8 space-y-8'>
			<PageTitle
				actions={
					lesson.file_url ? (
						<Button asChild variant='outline'>
							<Link href={lesson.file_url} target='_blank'>
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
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>Основная информация</CardTitle>
						<CardDescription>Тема, модуль и организационные параметры занятия</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='grid gap-5 sm:grid-cols-2'>
							<InfoRow icon={<Folder className='h-4 w-4' />} label='РУП' value={lesson.rup_name} />
							<InfoRow
								icon={<Grid2X2 className='h-4 w-4' />}
								label='Дисциплина'
								value={lesson.discipline_name}
							/>
							<Row label='Тип занятия' value={normalizeLessonType(lesson.type)} />
							<Row label='ID занятия' value={lesson.id} />
						</div>
						<Separator />
						<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
							<InfoRow
								icon={<Calendar className='h-4 w-4' />}
								label='Дата проведения'
								value={new Date(lesson.event_date).toLocaleString('ru-RU')}
							/>
							<InfoRow icon={<UserRound className='h-4 w-4' />} label='teacher_id' value={lesson.teacher_id} />
							<InfoRow icon={<Grid2X2 className='h-4 w-4' />} label='group_id' value={lesson.group_id} />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ресурсы</CardTitle>
						<CardDescription>Списки ресурсов с прокруткой для больших объемов</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<ResourceList items={lesson.internet_resources} title='Интернет-ресурсы' />
						<ResourceList items={lesson.technical_resources} title='Технические ресурсы' />
						<div className='rounded-md border p-3 text-sm text-muted-foreground break-all'>
							<div className='mb-2 inline-flex items-center gap-2 text-foreground'>
								<FileText className='h-4 w-4' />
								Файл урока
							</div>
							<div>{lesson.file_url || 'Файл не указан'}</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 xl:grid-cols-3'>
				<Card className='lg:col-span-1'>
					<CardHeader>
						<CardTitle>Цели</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7'>
						{lesson.goals || 'Пусто'}
					</CardContent>
				</Card>
				<Card className='lg:col-span-1'>
					<CardHeader>
						<CardTitle>Задачи</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7'>
						{lesson.tasks || 'Пусто'}
					</CardContent>
				</Card>
				<Card className='lg:col-span-1'>
					<CardHeader>
						<CardTitle>Ожидаемые результаты</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7'>
						{lesson.expected || 'Пусто'}
					</CardContent>
				</Card>
			</div>

			<Card className='overflow-hidden'>
				<CardHeader>
					<CardTitle>Служебные поля</CardTitle>
					<CardDescription>ID и даты создания/обновления</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
						<Row label='created_at' value={lesson.created_at} />
						<Row label='updated_at' value={lesson.updated_at} />
						<Row label='teacher_id' value={lesson.teacher_id} />
						<Row label='group_id' value={lesson.group_id} />
					</div>
				</CardContent>
			</Card>
		</section>
	)
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className='space-y-1 rounded-md border p-3'>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='text-sm font-medium break-all'>{value || 'Пусто'}</p>
		</div>
	)
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
	return (
		<div className='space-y-1 rounded-md border p-3'>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='text-sm font-medium break-all inline-flex items-center gap-2'>
				{icon}
				{value || 'Пусто'}
			</p>
		</div>
	)
}

function ResourceList({ title, items }: { title: string; items: string[] }) {
	return (
		<div className='space-y-2'>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{title}</p>
			<div className='max-h-56 overflow-auto rounded-md border p-3'>
				{items.length ? (
					<ul className='space-y-2'>
						{items.map((item, index) => (
							<li key={`${title}-${index}`} className='flex items-start gap-2'>
								<Badge className='mt-0.5' variant='secondary'>
									{index + 1}
								</Badge>
								<span className='text-sm break-all'>{item}</span>
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
