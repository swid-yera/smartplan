'use client'

import type { Dispatch, SetStateAction } from 'react'

import { getUILocaleSection } from '@helpers'
import { Card, CardContent, CardHeader, CardTitle, Textarea } from '@shadcn'
import { useLocaleStore } from '@store'
import type { Locale } from '@types'
import { ListChecks, Target, Trophy } from 'lucide-react'

import type { ILessonFormState } from './lesson-edit.types'
import localeDictionary from './locale.json'

type IProps = {
	activeLocale: Locale
	formData: ILessonFormState
	onFormDataChange: Dispatch<SetStateAction<ILessonFormState>>
}

export function LessonTextSections({ activeLocale, formData, onFormDataChange }: IProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<div className='grid gap-6 xl:grid-cols-3'>
			<Card>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2'>
						<Target className='h-4 w-4 text-primary' />
						{t.goalsTitle}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						className='min-h-44'
						value={formData.goals[activeLocale]}
						onChange={(e) =>
							onFormDataChange((prev) => ({
								...prev,
								goals: { ...prev.goals, [activeLocale]: e.target.value },
							}))
						}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2'>
						<ListChecks className='h-4 w-4 text-primary' />
						{t.tasksTitle}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						className='min-h-44'
						value={formData.tasks[activeLocale]}
						onChange={(e) =>
							onFormDataChange((prev) => ({
								...prev,
								tasks: { ...prev.tasks, [activeLocale]: e.target.value },
							}))
						}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2'>
						<Trophy className='h-4 w-4 text-primary' />
						{t.expectedTitle}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						className='min-h-44'
						value={formData.expected[activeLocale]}
						onChange={(e) =>
							onFormDataChange((prev) => ({
								...prev,
								expected: { ...prev.expected, [activeLocale]: e.target.value },
							}))
						}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
