'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { services } from '@services'
import { Button, ButtonGroup } from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import type { ILesson, IUpdateLessonRequest } from '@types'
import { LessonResourceTypeEnum } from '@types'
import { Grid2X2, Link2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import type { ILessonFormState } from './lesson-edit.types'
import {
	createEmptyLessonProgress,
	createEmptyResource,
	extractSaveErrorMessage,
	getEventTimeError,
	mapLessonProgressForForm,
	mapResourcesForForm,
	normalizeLessonProgressForRequest,
	normalizeResources,
	normalizeTimeInputOnBlur,
	serializeSaveError,
	toEventDateFormState,
	toIsoFromDateAndTimeInput,
} from './lesson-edit.utils'
import { LessonMainInfoCard } from './lesson-main-info-card'
import { LessonProgressEditor } from './lesson-progress-editor'
import { LessonTextSections } from './lesson-text-sections'
import { ResourceEditor } from './resource-editor'

type IProps = {
	lesson: ILesson
}

export function LessonEditForm({ lesson }: IProps) {
	const { replace } = useRouter()
	const updateLessonMutation = useMutation(services.lesson.updateMutationOptions())
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
	const [eventTimeError, setEventTimeError] = useState<string | null>(null)

	const [formData, setFormData] = useState<ILessonFormState>(() => ({
		...toEventDateFormState(lesson.event_date),
		topicName: lesson.topic_name,
		type: lesson.type,
		goals: lesson.goals || '',
		tasks: lesson.tasks || '',
		expected: lesson.expected || '',
		fileUrl: lesson.file_url || '',
		lessonProgress: mapLessonProgressForForm(lesson),
		internetResources: mapResourcesForForm(lesson.internet_resources),
		technicalResources: mapResourcesForForm(lesson.technical_resources),
	}))

	const handleResourceChange = (
		kind: 'internetResources' | 'technicalResources',
		index: number,
		field: 'name' | 'link',
		value: string,
	) => {
		setFormData((prev) => {
			const nextResources = [...prev[kind]]

			nextResources[index] = {
				...nextResources[index],
				[field]: value,
			}

			return {
				...prev,
				[kind]: nextResources,
			}
		})
	}

	const handleAddResource = (kind: 'internetResources' | 'technicalResources') => {
		setFormData((prev) => ({
			...prev,
			[kind]: [...prev[kind], createEmptyResource()],
		}))
	}

	const handleRemoveResource = (kind: 'internetResources' | 'technicalResources', index: number) => {
		setFormData((prev) => {
			if (prev[kind].length <= 1) {
				return {
					...prev,
					[kind]: [createEmptyResource()],
				}
			}

			return {
				...prev,
				[kind]: prev[kind].filter((_, itemIndex) => itemIndex !== index),
			}
		})
	}

	const handleLessonProgressChange = (
		index: number,
		field: 'name' | 'firstTime' | 'secondTime' | 'thirdTime' | 'contentText',
		value: string,
	) => {
		setFormData((prev) => {
			const nextLessonProgress = [...prev.lessonProgress]
			const current = nextLessonProgress[index]

			if (!current) return prev

			if (field === 'firstTime' || field === 'secondTime' || field === 'thirdTime') {
				nextLessonProgress[index] = {
					...current,
					[field]: Math.max(0, Number.parseInt(value, 10) || 0),
				}
			} else {
				nextLessonProgress[index] = {
					...current,
					[field]: value,
				}
			}

			return {
				...prev,
				lessonProgress: nextLessonProgress,
			}
		})
	}

	const handleAddLessonProgress = () => {
		setFormData((prev) => ({
			...prev,
			lessonProgress: [...prev.lessonProgress, createEmptyLessonProgress()],
		}))
	}

	const handleRemoveLessonProgress = (index: number) => {
		setFormData((prev) => {
			if (prev.lessonProgress.length <= 1) {
				return {
					...prev,
					lessonProgress: [createEmptyLessonProgress()],
				}
			}

			return {
				...prev,
				lessonProgress: prev.lessonProgress.filter((_, itemIndex) => itemIndex !== index),
			}
		})
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const normalizedEventTime = normalizeTimeInputOnBlur(formData.eventTime)
		const nextEventTimeError = getEventTimeError(normalizedEventTime)

		if (normalizedEventTime !== formData.eventTime) {
			setFormData((prev) => ({ ...prev, eventTime: normalizedEventTime }))
		}

		setEventTimeError(nextEventTimeError)

		if (!formData.topicName.trim()) {
			toast.error('Введите тему урока')

			return
		}

		if (!formData.eventDate) {
			toast.error('Укажите дату проведения')

			return
		}

		if (nextEventTimeError) {
			toast.error(nextEventTimeError)

			return
		}

		const payload: IUpdateLessonRequest = {
			topic_name: formData.topicName.trim(),
			type: formData.type,
			event_date: toIsoFromDateAndTimeInput(formData.eventDate, normalizedEventTime, lesson.event_date),
			goals: formData.goals.trim(),
			tasks: formData.tasks.trim(),
			expected: formData.expected.trim(),
			file_url: formData.fileUrl.trim() || null,
			lesson_progress: normalizeLessonProgressForRequest(formData.lessonProgress),
			internet_resources: normalizeResources(formData.internetResources, LessonResourceTypeEnum.INTERNET),
			technical_resources: normalizeResources(formData.technicalResources, LessonResourceTypeEnum.TECHNICAL),
		}

		const progressTotals = payload.lesson_progress.reduce(
			(acc, item) => {
				acc.first += Number(item.first_time?.[0] || 0)
				acc.second += Number(item.second_time?.[0] || 0)
				acc.third += Number(item.third_time?.[0] || 0)
				return acc
			},
			{ first: 0, second: 0, third: 0 },
		)
		if (progressTotals.first !== 90 || progressTotals.second !== 90 || progressTotals.third !== 90) {
			toast.error('Сумма минут по каждому варианту должна быть 90', {
				description: `Сейчас: ${progressTotals.first}/${progressTotals.second}/${progressTotals.third}`,
			})
			return
		}

		const toastId = `lesson-${lesson.id}-update`

		toast.loading('Сохранение урока...', { id: toastId })

		updateLessonMutation.mutate(
			{ changedLesson: payload, id: lesson.id },
			{
				onSuccess: () => {
					toast.success('Урок успешно обновлен', { id: toastId })
					replace(`/lessons/${lesson.id}`)
				},
				onError: (err) => {
					const saveErrorDescription = extractSaveErrorMessage(err)

					console.log('Lesson save failed', {
						error: serializeSaveError(err),
						lessonId: lesson.id,
						payload,
					})

					toast.error('Ошибка при сохранении урока', {
						description: saveErrorDescription,
						id: toastId,
					})
				},
			},
		)
	}

	return (
		<section className='mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8'>
			<PageTitle
				actions={
					<ButtonGroup className='col-start-2'>
						<Button form='lesson-edit-form' type='submit'>
							<Save className='mr-2 h-4 w-4' />
							Сохранить
						</Button>
						<Button variant='outline' onClick={() => replace(`/lessons/${lesson.id}`)}>
							<X className='mr-2 h-4 w-4' />
							Отмена
						</Button>
					</ButtonGroup>
				}
				backHref={`/lessons/${lesson.id}`}
				description='Редактирование плана учебного занятия'
			>
				Редактировать урок
			</PageTitle>

			<form className='space-y-6' id='lesson-edit-form' onSubmit={handleSubmit}>
				<LessonMainInfoCard
					eventTimeError={eventTimeError}
					formData={formData}
					isDatePickerOpen={isDatePickerOpen}
					onDatePickerOpenChange={setIsDatePickerOpen}
					onEventTimeErrorChange={setEventTimeError}
					onFormDataChange={setFormData}
				/>

				<LessonTextSections formData={formData} onFormDataChange={setFormData} />

				<LessonProgressEditor
					items={formData.lessonProgress}
					onAdd={handleAddLessonProgress}
					onChange={handleLessonProgressChange}
					onRemove={handleRemoveLessonProgress}
				/>

				<div className='grid gap-6 xl:grid-cols-2'>
					<ResourceEditor
						description='Ссылки и онлайн-материалы'
						icon={<Link2 className='h-4 w-4 text-primary' />}
						items={formData.internetResources}
						title='Интернет-ресурсы'
						onAdd={() => handleAddResource('internetResources')}
						onChange={(index, field, value) => handleResourceChange('internetResources', index, field, value)}
						onRemove={(index) => handleRemoveResource('internetResources', index)}
					/>
					<ResourceEditor
						description='Оборудование и локальные материалы'
						icon={<Grid2X2 className='h-4 w-4 text-primary' />}
						items={formData.technicalResources}
						title='Технические ресурсы'
						onAdd={() => handleAddResource('technicalResources')}
						onChange={(index, field, value) => handleResourceChange('technicalResources', index, field, value)}
						onRemove={(index) => handleRemoveResource('technicalResources', index)}
					/>
				</div>
			</form>
		</section>
	)
}
