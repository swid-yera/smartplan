'use client'

import Link from 'next/link'

import { EmptyCard, Loader, PageTitle } from '@components'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { Calendar, FileText, Plus, Users } from 'lucide-react'

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
				actions={
					<Button asChild>
						<Link href='/lessons/create'>
							<Plus className='mr-2 h-4 w-4' />
							Сгенерировать план
						</Link>
					</Button>
				}
				description='Ваши планы учебных занятий, созданные вручную или с помощью генерации'
			>
				Мои планы учебных занятий
			</PageTitle>

			{(!data?.data || !data?.data.length) && <EmptyCard type='LESSON' />}

			{data?.data && data.data.length > 0 && (
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{data.data.map((lesson) => (
						<Card key={lesson.id} className='flex flex-col'>
							<CardHeader className='space-y-2'>
								<div className='flex items-start justify-between gap-2'>
									<CardTitle className='text-base leading-snug line-clamp-2'>{lesson.topic_name}</CardTitle>
									{/* lessonTypeBadge(lesson.type) */}
								</div>

								<CardDescription className='space-y-1'>
									<p>{lesson.discipline_name}</p>
									<p className='text-xs text-muted-foreground'>РУП: {lesson.rup_name}</p>
								</CardDescription>
							</CardHeader>

							<CardContent className='mt-auto space-y-4 text-sm'>
								<div className='space-y-2 text-muted-foreground'>
									<div className='flex items-center gap-2'>
										<Users className='h-4 w-4' />
										<span>{lesson.group_id}</span>
									</div>

									<div className='flex items-center gap-2'>
										<Calendar className='h-4 w-4' />
										<span>{new Date(lesson.event_date).toLocaleDateString()}</span>
									</div>
								</div>

								<div className='flex gap-2'>
									<Button asChild className='w-full' size='sm'>
										<Link href={`/lessons/${lesson.id}`}>
											<FileText className='mr-2 h-4 w-4' />
											Открыть
										</Link>
									</Button>

									<Button asChild className='w-full' size='sm' variant='outline'>
										<Link href={`/lessons/${lesson.id}/edit`}>Редактировать</Link>
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
