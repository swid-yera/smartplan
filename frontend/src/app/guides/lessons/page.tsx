'use client'

import Link from 'next/link'

import { PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { BookOpen, Bot, FileText, Sparkles } from 'lucide-react'
import localeDictionary from './locale.json'

export default function LessonPlansPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			{/* Что это */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BookOpen className='h-5 w-5 text-primary' />
						{t.whatIsTitle}
					</CardTitle>
					<CardDescription>{t.whatIsDescription}</CardDescription>
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
						{t.howWorksTitle}
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
						<li>Готовый план учебных занятий доступен для редактирования и сохранения.</li>
					</ol>
				</CardContent>
			</Card>

			{/* Преимущества */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Sparkles className='h-5 w-5 text-primary' />
						{t.advantagesTitle}
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
						<p className='font-medium'>{t.startTitle}</p>
						<p className='text-sm text-muted-foreground'>{t.startDescription}</p>
					</div>

					<div className='flex gap-3'>
						<Button asChild>
							<Link href='/lessons/create'>
								<FileText className='mr-2 h-4 w-4' />
								{t.generatePlan}
							</Link>
						</Button>

						<Button asChild variant='outline'>
							<Link href='/lessons/my'>
								<BookOpen className='mr-2 h-4 w-4' />
								{t.myPlans}
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	)
}
