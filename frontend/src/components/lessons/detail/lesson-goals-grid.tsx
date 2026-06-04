'use client'

import { getLocaleText, getUILocaleSection } from '@helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import type { ILesson } from '@types'
import type { Locale } from '@types'
import { ListChecks, Target, Trophy } from 'lucide-react'

import localeDictionary from './locale.json'

type IProps = {
	cardClassName: string
	lesson: ILesson
	lessonLocale: Locale
}

export function LessonGoalsGrid({ cardClassName, lesson, lessonLocale }: IProps) {
	const t = getUILocaleSection(localeDictionary, lessonLocale)

	return (
		<div className='grid gap-6 xl:grid-cols-3'>
			<Card className={`${cardClassName} lg:col-span-1`}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<Target className='h-4 w-4' />
						</span>
						{t.goalsTitle}
					</CardTitle>
				</CardHeader>
				<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
					{getLocaleText(lesson.goals, lessonLocale) || t.empty}
				</CardContent>
			</Card>
			<Card className={`${cardClassName} lg:col-span-1`}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<ListChecks className='h-4 w-4' />
						</span>
						{t.tasksTitle}
					</CardTitle>
				</CardHeader>
				<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
					{getLocaleText(lesson.tasks, lessonLocale) || t.empty}
				</CardContent>
			</Card>
			<Card className={`${cardClassName} lg:col-span-1`}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<Trophy className='h-4 w-4' />
						</span>
						{t.expectedTitle}
					</CardTitle>
				</CardHeader>
				<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
					{getLocaleText(lesson.expected, lessonLocale) || t.empty}
				</CardContent>
			</Card>
		</div>
	)
}
