'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import type { ILesson } from '@types'
import { ListChecks, Target, Trophy } from 'lucide-react'

type IProps = {
	cardClassName: string
	lesson: ILesson
}

export function LessonGoalsGrid({ cardClassName, lesson }: IProps) {
	return (
		<div className='grid gap-6 xl:grid-cols-3'>
			<Card className={`${cardClassName} lg:col-span-1`}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<Target className='h-4 w-4' />
						</span>
						Цели
					</CardTitle>
				</CardHeader>
				<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
					{lesson.goals || 'Пусто'}
				</CardContent>
			</Card>
			<Card className={`${cardClassName} lg:col-span-1`}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<ListChecks className='h-4 w-4' />
						</span>
						Задачи
					</CardTitle>
				</CardHeader>
				<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
					{lesson.tasks || 'Пусто'}
				</CardContent>
			</Card>
			<Card className={`${cardClassName} lg:col-span-1`}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<Trophy className='h-4 w-4' />
						</span>
						Ожидаемые результаты
					</CardTitle>
				</CardHeader>
				<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
					{lesson.expected || 'Пусто'}
				</CardContent>
			</Card>
		</div>
	)
}
