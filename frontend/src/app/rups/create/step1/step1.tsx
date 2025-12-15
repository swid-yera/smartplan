import type { FC, KeyboardEvent } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form } from '@ui'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { formatCourseFromYearAndGroupName } from '@/helpers'

import { groupData } from '../mock.data'
import { BasicDataCard } from './basic-data-card'
import { ExplorationNoteCard } from './exploration-note-card'
import { GoalsCard } from './goals-card'
import { GroupCard } from './group-card'

// form scheme
const formSchema = z
	.object({
		title: z.string().min(1, 'Наименование РУП обязательно'),
		type: z.string().min(1, 'Тип Модуля обязателен'),
		studyForm: z.string().min(1, 'Форма обучения обязательна'),
		explorationNote: z.string().optional(), // This should probably be a string for a text area
		goals: z.string().optional(), // This should probably be a string for a text area
		prerequisites: z.string().optional(),
		postrequisites: z.string().optional(),
		year: z.string().min(1, 'Учебный год обязателен'),
		groupId: z.string().min(1, 'Группа обязательна'),
	})
	.superRefine((data, ctx) => {
		if (data.groupId && data.year) {
			const selectedGroup = groupData.find((group) => group.id === data.groupId)

			if (selectedGroup) {
				const course = formatCourseFromYearAndGroupName(selectedGroup.name, data.year)

				if (typeof course === 'string') {
					ctx.addIssue({
						code: 'custom',
						message: course,
						path: ['groupId'],
					})
				}
			}
		}
	})

export type FormData = z.infer<typeof formSchema>

export const Step1: FC = () => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: 'onSubmit',
		defaultValues: {
			title: '',
			type: '',
			studyForm: '',
			explorationNote: '',
			goals: '',
			prerequisites: '',
			postrequisites: '',
			year: '',
			groupId: '',
		},
	})

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		// Prevent form submission on "Enter" key press in input fields
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	const onSave = (values: z.infer<typeof formSchema>) => {
		console.log('save', values)
	}

	return (
		<Form {...form}>
			<form className='w-full space-y-5' onKeyDown={handleKeyDown} onSubmit={form.handleSubmit(onSave)}>
				<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]'>
					<BasicDataCard form={form} />
					<ExplorationNoteCard form={form} />
				</div>

				<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]'>
					<GoalsCard form={form} />
					<GroupCard form={form} />
				</div>

				<Button size='lg' type='submit' variant='default'>
					Сохранить
				</Button>
			</form>
		</Form>
	)
}
