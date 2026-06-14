'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { createLocaleText, getUILocaleSection, toBackendLocale } from '@helpers'
import { useUnsavedChangesGuard } from '@hooks'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useMutation } from '@tanstack/react-query'
import type { ILesson, IUpdateLessonRequest, Locale } from '@types'
import { LessonResourceTypeEnum } from '@types'
import { Grid2X2, Link2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import { LocaleToggleButton } from '../../ui/locale-toggle-button'
import { PageTitle } from '../../ui/page-title'
import { type PageTitleAction, PageTitleActions } from '../../ui/page-title-actions'
import type { ILessonFormState } from './lesson-edit.types'
import {
	createEmptyResource,
	createLocaleDraft,
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
import localeDictionary from './locale.json'
import { ResourceEditor } from './resource-editor'

type IProps = {
	lesson: ILesson
	activeLocale: Locale
	onActiveLocaleChange: (locale: Locale) => void
}

export function LessonEditForm({ lesson, activeLocale, onActiveLocaleChange }: IProps) {
	const { replace } = useRouter()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const updateLessonMutation = useMutation(services.lesson.updateMutationOptions())
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
	const [eventTimeError, setEventTimeError] = useState<string | null>(null)

	const [initialFormData] = useState<ILessonFormState>(() => ({
		...toEventDateFormState(lesson.event_date),
		topicName: createLocaleDraft(lesson.topic_name),
		type: lesson.type,
		goals: createLocaleDraft(lesson.goals),
		tasks: createLocaleDraft(lesson.tasks),
		expected: createLocaleDraft(lesson.expected),
		fileUrl: lesson.file_url || '',
		lessonProgress: mapLessonProgressForForm(lesson),
		internetResources: mapResourcesForForm(lesson.internet_resources),
		technicalResources: mapResourcesForForm(lesson.technical_resources),
	}))
	const [formData, setFormData] = useState<ILessonFormState>(initialFormData)
	const hasUnsavedChanges = useMemo(
		() => JSON.stringify(formData) !== JSON.stringify(initialFormData),
		[formData, initialFormData],
	)
	const { confirmNavigation } = useUnsavedChangesGuard(hasUnsavedChanges, t.unsavedChangesMessage)
	const pageActions: PageTitleAction[] = [
		{
			id: 'save',
			label: t.save,
			icon: Save,
			form: 'lesson-edit-form',
			type: 'submit',
			priority: 'primary',
		},
		{
			id: 'cancel',
			label: t.cancel,
			icon: X,
			onClick: () => {
				if (!confirmNavigation()) return
				replace(`/lessons/${lesson.id}`)
			},
		},
	]

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

	const handleLessonProgressChange = (index: number, field: 'contentText', value: string) => {
		setFormData((prev) => {
			const nextLessonProgress = [...prev.lessonProgress]
			const current = nextLessonProgress[index]

			if (!current) return prev

			nextLessonProgress[index] = {
				...current,
				[field]: {
					...current[field],
					[activeLocale]: value,
				},
			}

			return {
				...prev,
				lessonProgress: nextLessonProgress,
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

		if (!formData.topicName.ru.trim() && !formData.topicName.kk.trim()) {
			toast.error(t.enterLessonTopic)

			return
		}

		if (!formData.eventDate) {
			toast.error(t.enterLessonDate)

			return
		}

		if (nextEventTimeError) {
			toast.error(t.enterLessonTime, { description: nextEventTimeError })

			return
		}

		const payload: IUpdateLessonRequest = {
			topic_name: createLocaleText(formData.topicName.ru.trim(), formData.topicName.kk.trim()),
			type: formData.type,
			event_date: toIsoFromDateAndTimeInput(formData.eventDate, normalizedEventTime, lesson.event_date),
			sourceLanguage: toBackendLocale(activeLocale),
			goals: createLocaleText(formData.goals.ru.trim(), formData.goals.kk.trim()),
			tasks: createLocaleText(formData.tasks.ru.trim(), formData.tasks.kk.trim()),
			expected: createLocaleText(formData.expected.ru.trim(), formData.expected.kk.trim()),
			file_url: formData.fileUrl.trim() || null,
			lesson_progress: normalizeLessonProgressForRequest(formData.lessonProgress),
			internet_resources: normalizeResources(formData.internetResources, LessonResourceTypeEnum.INTERNET),
			technical_resources: normalizeResources(formData.technicalResources, LessonResourceTypeEnum.TECHNICAL),
		}

		const toastId = `lesson-${lesson.id}-update`

		toast.loading(t.savingLesson, { id: toastId })

		updateLessonMutation.mutate(
			{ changedLesson: payload, id: lesson.id },
			{
				onSuccess: () => {
					toast.success(t.lessonSaved, { id: toastId })
					replace(`/lessons/${lesson.id}`)
				},
				onError: (err) => {
					const saveErrorDescription = extractSaveErrorMessage(err)

					console.log('Lesson save failed', {
						error: serializeSaveError(err),
						lessonId: lesson.id,
						payload,
					})

					toast.error(t.saveLessonError, {
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
					<PageTitleActions
						actions={pageActions}
						moreLabel={t.moreActions}
						trailing={
							<LocaleToggleButton
								activeLocale={activeLocale}
								labels={{ kk: t.languageKk, ru: t.languageRu }}
								onChangeLocale={onActiveLocaleChange}
							/>
						}
					/>
				}
				backHref='back'
				description={t.editDescription}
				onBackClick={confirmNavigation}
			>
				{t.editTitle}
			</PageTitle>

			<form className='space-y-6' id='lesson-edit-form' onSubmit={handleSubmit}>
				<LessonMainInfoCard
					activeLocale={activeLocale}
					eventTimeError={eventTimeError}
					formData={formData}
					isDatePickerOpen={isDatePickerOpen}
					onDatePickerOpenChange={setIsDatePickerOpen}
					onEventTimeErrorChange={setEventTimeError}
					onFormDataChange={setFormData}
				/>

				<LessonTextSections activeLocale={activeLocale} formData={formData} onFormDataChange={setFormData} />

				<LessonProgressEditor
					activeLocale={activeLocale}
					items={formData.lessonProgress}
					onChange={handleLessonProgressChange}
				/>

				<div className='grid gap-6 xl:grid-cols-2'>
					<ResourceEditor
						activeLocale={activeLocale}
						description={t.internetResourcesDescription}
						icon={<Link2 className='h-4 w-4 text-primary' />}
						items={formData.internetResources}
						title={t.internetResourcesTitle}
						onAdd={() => handleAddResource('internetResources')}
						onChange={(index, field, value) => handleResourceChange('internetResources', index, field, value)}
						onRemove={(index) => handleRemoveResource('internetResources', index)}
					/>
					<ResourceEditor
						activeLocale={activeLocale}
						description={t.technicalResourcesDescription}
						icon={<Grid2X2 className='h-4 w-4 text-primary' />}
						items={formData.technicalResources}
						title={t.technicalResourcesTitle}
						onAdd={() => handleAddResource('technicalResources')}
						onChange={(index, field, value) => handleResourceChange('technicalResources', index, field, value)}
						onRemove={(index) => handleRemoveResource('technicalResources', index)}
					/>
				</div>
			</form>
		</section>
	)
}
