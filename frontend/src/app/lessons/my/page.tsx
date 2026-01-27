'use client'

import Link from 'next/link'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { BookOpen, FileText, Plus } from 'lucide-react'

export default function MyLessonPlansPage() {
	const { data, isLoading } = useQuery({
		...services.lesson.getAllOptions({ teacher: '' }),
	})

	if (isLoading) {
		return <Loader />
	}

	return (
		<section className='mx-auto w-full max-w-6xl p-6 space-y-6'>
			<PageTitle
				description='Список поурочных планов, созданных вами'
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
			{!data?.length && (
				<Card>
					<CardContent className='py-10 text-center space-y-3'>
						<BookOpen className='mx-auto h-10 w-10 text-muted-foreground' />
						<p className='font-medium'>Поурочные планы не найдены</p>
						<p className='text-sm text-muted-foreground'>
							Вы ещё не создавали поурочные планы. Начните с генерации нового.
						</p>

						<Button asChild className='mt-3'>
							<Link href='/lesson-plans/generate'>
								<Plus className='mr-2 h-4 w-4' />
								Сгенерировать план
							</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Список планов */}
			{data?.length > 0 && (
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{data.map((plan) => (
						<Card key={plan.id} className='flex flex-col'>
							<CardHeader>
								<CardTitle className='line-clamp-2'>{plan.title}</CardTitle>
								<CardDescription>{plan.disciplineName}</CardDescription>
							</CardHeader>

							<CardContent className='mt-auto space-y-4'>
								<div className='text-sm text-muted-foreground space-y-1'>
									<p>Тема: {plan.topic}</p>
									<p>Часов: {plan.hours}</p>
									<p>Создан: {new Date(plan.createdAt).toLocaleDateString()}</p>
								</div>

								<div className='flex gap-2'>
									<Button asChild size='sm' className='w-full'>
										<Link href={`/lesson-plans/${plan.id}`}>
											<FileText className='mr-2 h-4 w-4' />
											Открыть
										</Link>
									</Button>

									<Button size='sm' variant='outline' className='w-full' asChild>
										<Link href={`/lesson-plans/${plan.id}/edit`}>Редактировать</Link>
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
