'use client'

import Link from 'next/link'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { BookOpen, Calendar, FileText, Plus, Users } from 'lucide-react'

export default function MyLessonPlansPage() {
	const { authLoading, user } = useAuthStore()

	const { data, isLoading } = useQuery({
		...services.lesson.getAllOptions({ teacher: user?.keycloakId }),
		enabled: !authLoading && !!user,
	})

	if (isLoading) {
		return <Loader />
	}

	return (
		<section className='mx-auto w-full max-w-7xl p-6 space-y-6'>
			<PageTitle
				description='Ваши поурочные планы, созданные вручную или с помощью генерации'
				actions={
					<Button asChild>
						<Link href='/lesson-plans/generate'>
							<Plus className='mr-2 h-4 w-4' />
							Сгенерировать план
						</Link>
					</Button>
				}
			>
				Мои поурочные планы
			</PageTitle>

			{/* Пустое состояние */}
			{(!data?.data || !data?.data.length) && (
				<Card>
					<CardContent className='py-12 text-center space-y-3'>
						<BookOpen className='mx-auto h-10 w-10 text-muted-foreground' />
						<p className='font-medium'>Поурочные планы не найдены</p>
						<p className='text-sm text-muted-foreground max-w-md mx-auto'>
							Здесь будут отображаться поурочные планы, созданные вами или сгенерированные системой.
						</p>

						<Button asChild className='mt-4'>
							<Link href='/lesson-plans/generate'>
								<Plus className='mr-2 h-4 w-4' />
								Создать первый план
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Список поурочных планов */}
			{data?.data && data.data.length > 0 && (
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{data.data.map((lesson) => (
						<Card key={lesson.id} className='flex flex-col'>
							<CardHeader className='space-y-2'>
								<div className='flex items-start justify-between gap-2'>
									<CardTitle className='text-base leading-snug line-clamp-2'>{lesson.topicName}</CardTitle>
									{/* lessonTypeBadge(lesson.type) */}
								</div>

								<CardDescription className='space-y-1'>
									<p>{lesson.disciplineName}</p>
									<p className='text-xs text-muted-foreground'>РУП: {lesson.rupName}</p>
								</CardDescription>
							</CardHeader>

							<CardContent className='mt-auto space-y-4 text-sm'>
								<div className='space-y-2 text-muted-foreground'>
									<div className='flex items-center gap-2'>
										<Users className='h-4 w-4' />
										<span>{lesson.group.name}</span>
									</div>

									<div className='flex items-center gap-2'>
										<Calendar className='h-4 w-4' />
										<span>{new Date(lesson.eventDate).toLocaleDateString()}</span>
									</div>

									<p>
										Этапов занятия: <b>{lesson.progress.length}</b>
									</p>
								</div>

								<div className='flex gap-2'>
									<Button asChild size='sm' className='w-full'>
										<Link href={`/lesson-plans/${lesson.id}`}>
											<FileText className='mr-2 h-4 w-4' />
											Открыть
										</Link>
									</Button>

									<Button asChild size='sm' variant='outline' className='w-full'>
										<Link href={`/lesson-plans/${lesson.id}/edit`}>Редактировать</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</section>
	)
}
