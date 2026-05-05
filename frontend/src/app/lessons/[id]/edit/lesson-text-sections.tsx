'use client'

import type { Dispatch, SetStateAction } from 'react'

import { Card, CardContent, CardHeader, CardTitle, Textarea } from '@shadcn'
import { ListChecks, Target, Trophy } from 'lucide-react'

import type { ILessonFormState } from './lesson-edit.types'

type IProps = {
	formData: ILessonFormState
	onFormDataChange: Dispatch<SetStateAction<ILessonFormState>>
}

export function LessonTextSections({ formData, onFormDataChange }: IProps) {
	return (
		<div className='grid gap-6 xl:grid-cols-3'>
			<Card>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2'>
						<Target className='h-4 w-4 text-primary' />
						Цели
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						className='min-h-44'
						value={formData.goals}
						onChange={(e) => onFormDataChange((prev) => ({ ...prev, goals: e.target.value }))}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2'>
						<ListChecks className='h-4 w-4 text-primary' />
						Задачи
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						className='min-h-44'
						value={formData.tasks}
						onChange={(e) => onFormDataChange((prev) => ({ ...prev, tasks: e.target.value }))}
					/>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2'>
						<Trophy className='h-4 w-4 text-primary' />
						Ожидаемые результаты
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						className='min-h-44'
						value={formData.expected}
						onChange={(e) => onFormDataChange((prev) => ({ ...prev, expected: e.target.value }))}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
