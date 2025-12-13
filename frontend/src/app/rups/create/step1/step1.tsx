import type { FC } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form } from '@ui'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { BasicDataCard } from './basic-data-card'
import { ExplorationNoteCard } from './exploration-note-card'
import { GoalsCard } from './goals-card'
import { GroupCard } from './group-card'

// form scheme
const formSchema = z.object({
	title: z.string().min(1, 'Наименование РУП обязательно'),
	year: z.string().min(9, 'Учебный год обязателен').max(9, 'Учебный год обязателен'),
	type: z.string().min(1, 'Тип РУП обязателен'),
	course: z.string().min(1, 'Курс обязателен'),
	studyForm: z.string().min(1, 'Форма обучения обязательна'),
	explorationNote: z.string().optional(), // This should probably be a string for a text area
	goals: z.string().optional(), // This should probably be a string for a text area
	prerequisites: z.string().optional(),
	postrequisites: z.string().optional(),
	groupId: z.string().min(1, 'Группа обязательна'),
})

export type FormData = z.infer<typeof formSchema>

export const Step1: FC = () => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: '',
			year: '',
			type: '',
			course: '1',
			studyForm: '',
			explorationNote: '',
			goals: '',
			prerequisites: '',
			postrequisites: '',
			groupId: '',
		},
	})

	const onSave = (values: z.infer<typeof formSchema>) => {
		console.log('save', values)
	}

	return (
		<Form {...form}>
			<form className='w-full space-y-5' onSubmit={form.handleSubmit(onSave)}>
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
