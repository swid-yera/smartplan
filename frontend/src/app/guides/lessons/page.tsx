'use client'

import Link from 'next/link'

import { PageTitle } from '@components'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { BookOpen, Bot, FileText, Sparkles } from 'lucide-react'

export default function LessonPlansPage() {
	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description='Автоматическое создание плана учебного занятия с учетом учебных программ и требований'>
				Генерация плана учебного занятия
			</PageTitle>

			{/* Что это */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BookOpen className='h-5 w-5 text-primary' />
						Что такое генерация плана учебного занятия
					</CardTitle>
					<CardDescription>Интеллектуальный инструмент для преподавателей</CardDescription>
				</CardHeader>

				<CardContent className='space-y-3 text-sm leading-relaxed'>
					<p>
						Генерация планов учебного занятия — это автоматизированный процесс создания структурированных планов
						занятий на основе рабочей учебной программы, дисциплины, темы и количества часов.
					</p>

					<p>
						Система учитывает требования образовательных стандартов, логику изложения материала и помогает
						преподавателю быстро подготовить качественный план урока.
					</p>
				</CardContent>
			</Card>

			{/* Как работает */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Bot className='h-5 w-5 text-primary' />
						Как работает генерация
					</CardTitle>
				</CardHeader>

				<CardContent className='space-y-4 text-sm'>
					<ol className='space-y-3 list-decimal list-inside text-muted-foreground'>
						<li>Вы выбираете дисциплину, тему занятия и количество учебных часов.</li>
						<li>Система анализирует рабочую учебную программу и связанные темы.</li>
						<li>
							Искусственный интеллект формирует структуру урока: цели, этапы, методы обучения и ожидаемые
							результаты.
						</li>
						<li>Готовый поурочный план доступен для редактирования и сохранения.</li>
					</ol>
				</CardContent>
			</Card>

			{/* Преимущества */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Sparkles className='h-5 w-5 text-primary' />
						Преимущества
					</CardTitle>
				</CardHeader>

				<CardContent className='space-y-2 text-sm text-muted-foreground'>
					<ul className='list-disc list-inside space-y-1'>
						<li>Экономия времени на подготовку занятий</li>
						<li>Единый стандарт оформления планов учебного занятия</li>
						<li>Соответствие учебным программам и требованиям</li>
						<li>Возможность редактирования и доработки</li>
						<li>Хранение и быстрый доступ к ранее созданным планам</li>
					</ul>
				</CardContent>
			</Card>

			{/* CTA */}
			<Card>
				<CardContent className='flex flex-col sm:flex-row gap-4 justify-between items-center'>
					<div className='space-y-1'>
						<p className='font-medium'>Начать работу с поурочными планами</p>
						<p className='text-sm text-muted-foreground'>Создавайте новые планы или управляйте уже созданными</p>
					</div>

					<div className='flex gap-3'>
						<Button asChild>
							<Link href='/lessons/create'>
								<FileText className='mr-2 h-4 w-4' />
								Сгенерировать план
							</Link>
						</Button>

						<Button asChild variant='outline'>
							<Link href='/lessons/my'>
								<BookOpen className='mr-2 h-4 w-4' />
								Мои поурочные планы
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	)
}
