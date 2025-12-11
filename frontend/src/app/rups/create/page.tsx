'use client'

import type { NextPage } from 'next'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@ui'
import { useForm } from 'react-hook-form'

import {
	BasicDataCard,
	ExplorationNoteCard,
	GoalsCard,
	InternetResourcesCard,
	RequisitesCard,
	TechnicalResourcesCard,
} from './step1'
import { StepHeader } from './step-header'
import { StepIndicator } from './step-indicator'

const Page: NextPage = () => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: '',
			year: '',
			group: '',
			course: undefined,
			studyForm: '',
			explorationNote: '',
			goals: '',
			prerequisites: [''],
			postrequisites: [''],
			internetResources: [''],
			technicalResources: [''],
		},
	})

	const onSave = (values: z.infer<typeof formSchema>) => {
		console.log('save', values)
	}

	return (
		<Form {...form}>
			<form className='mx-auto px-5 mt-5 w-full space-y-5' onSubmit={form.handleSubmit(onSave)}>
				<StepIndicator currentStep={1} steps={steps} />

				<StepHeader />

				<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]'>
					<BasicDataCard form={form} />
					<ExplorationNoteCard form={form} />
				</div>

				<div className='grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)]'>
					<GoalsCard form={form} />
					<RequisitesCard form={form} />
				</div>

				<div className='grid md:grid-cols-2 gap-4'>
					<InternetResourcesCard form={form} />
					<TechnicalResourcesCard form={form} />
				</div>
			</form>
		</Form>
	)
}

// steps
export interface IStep {
	id: number
	title: string
	description: string
}

const steps: IStep[] = [
	{
		id: 1,
		title: 'Создание нового рабочего учебного плана',
		description: 'Базовые данные, пояснительная записка, цели и задачи',
	},
	{
		id: 2,
		title: 'Метаданные, материалы и ресурсы',
		description: 'Метаданные, технические материалы и учебно методические ресурсы',
	},
	{
		id: 3,
		title: 'Разделы/Дисциплины учебной рабочей программы',
		description: 'Добавьте ',
	},
]

// form scheme
const formSchema = z.object({
	title: z.string().min(1, 'Наименование РУП обязательно'),
	year: z.string().min(9, 'Учебный год обязателен'),
	group: z.string().min(1, 'Группа обязательна'),
	course: z.number().min(1).max(4).optional(),
	studyForm: z.string().min(1, 'Форма обучения обязательна'),
	explorationNote: z.string().optional(),
	goals: z.string().optional(),
	prerequisites: z.array(z.string()).optional(),
	postrequisites: z.array(z.string()).optional(),

	internetResources: z.array(z.string()).optional(),
	technicalResources: z.array(z.string()).optional(),
})

export type FormData = z.infer<typeof formSchema>

export default Page
