'use client'

import { type KeyboardEvent, useEffect } from 'react'

import { PRACTICE_PROGRESS, THEORY_PROGRESS } from '@constants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shadcn'
import { LessonTypeEnum } from '@types'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'

import { LessonBasicInfo, LessonGoalsTasks, LessonProgressSection, LessonResourceEdit } from '../components'
import { type LessonFormData, lessonSchema } from '../lesson-schema'

const defaultValues: LessonFormData = {
	rupName: '',
	disciplineName: '',
	topicName: '',
	eventDate: new Date(),
	groups: '',
	type: LessonTypeEnum.THEORY,
	goals: '',
	tasks: '',
	expected: '',
	internetResources: [],
	technicalResources: [],
	lessonProgress: [{ name: '', startMinute: 0, endMinute: 5, content: [''] }],
}

const Page = () => {
	const methods = useForm<LessonFormData>({
		resolver: zodResolver(lessonSchema),
		shouldUnregister: false,
		defaultValues,
	})

	const internet = useFieldArray({ control: methods.control, name: 'internetResources' })
	const technical = useFieldArray({ control: methods.control, name: 'technicalResources' })

	// watching lesson type for progress
	const lessonType = methods.watch('type')

	useEffect(() => {
		const defaultProgress = lessonType === LessonTypeEnum.PRACTICE ? PRACTICE_PROGRESS : THEORY_PROGRESS

		const progressWithContent = defaultProgress.map((step) => ({
			...step,
			content: step.content.length ? step.content : [''],
		}))

		methods.setValue('lessonProgress', progressWithContent)
	}, [lessonType, methods])

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	const onSubmit = (values: LessonFormData) => {
		const payload = {
			...values,
			groups: values.groups.split(',').map((g) => g.trim()),
			event_date: values.eventDate.toISOString(),
		}
	}

	return (
		<div className='container max-w-5xl py-10 px-4 space-y-8'>
			<div className='flex flex-col gap-2'>
				<h1 className='text-3xl font-bold tracking-tight'>Создание занятия</h1>
				<p className='text-muted-foreground'>Заполните данные для формирования плана урока.</p>
			</div>

			<FormProvider {...methods}>
				<form className='space-y-8' onKeyDown={handleKeyDown} onSubmit={(e) => e.preventDefault()}>
					<LessonBasicInfo />
					<LessonGoalsTasks />
					<LessonProgressSection />
					<LessonResourceEdit
						append={() => internet.append({ name: '', link: '' })}
						fields={internet.fields}
						icon='🌐'
						namePrefix='internetResources'
						remove={internet.remove}
						title='Интернет ресурсы'
					/>
					<LessonResourceEdit
						append={() => technical.append({ name: '', link: '' })}
						fields={technical.fields}
						icon='🛠️'
						namePrefix='technicalResources'
						remove={technical.remove}
						title='Тех. оснащение'
					/>

					<Button className='w-full h-12 text-lg' onClick={(e) => methods.handleSubmit(onSubmit)(e)}>
						Создать занятие
					</Button>
				</form>
			</FormProvider>
		</div>
	)
}

export default Page
