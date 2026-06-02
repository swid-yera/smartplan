'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { createLocaleText, hasRole, topicTypeIcons } from '@helpers'
import { services } from '@services'
import { Button, ButtonGroup } from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import type { ILesson } from '@types'
import { RoleEnum, TopicTypeEnum } from '@types'
import { Edit, FileDown, RefreshCw, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { LessonDeleteDialog, LessonRegenerateDialog } from './lesson-action-dialogs'
import { LessonGoalsGrid } from './lesson-goals-grid'
import { LessonOverviewGrid } from './lesson-overview-grid'
import { type ILessonContext, type IRegenerateFormData } from './lesson-page.types'
import { normalizeLessonProgress } from './lesson-page.utils'
import { LessonProgressCard } from './lesson-progress-card'
import { LessonResourcesGrid } from './lesson-resources-grid'

type IProps = {
	canManageLesson: boolean
	lesson: ILesson
	userRole: RoleEnum
	userKeycloakId: string
}

export function LessonDetailsContent({ canManageLesson, lesson, userKeycloakId, userRole }: IProps) {
	const { push, replace } = useRouter()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)
	const [regenerateDescription, setRegenerateDescription] = useState('')
	const [regenerateFormData, setRegenerateFormData] = useState<IRegenerateFormData>({
		name: '',
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
		srspHours: 0,
		srsHours: 0,
		type: TopicTypeEnum.SNZ,
	})
	const deleteLessonMutation = useMutation(services.lesson.deleteMutationOptions())
	const regenerateLessonMutation = useMutation(services.lesson.generateLessonOptions())

	const lessonContext = lesson as ILessonContext
	const currentRupId = lessonContext.rup_id || lessonContext.rupId || ''
	const currentDisciplineId = lessonContext.discipline_id || lessonContext.disciplineId || ''
	const currentTopicId = lessonContext.topic_id || lessonContext.topicId || ''
	const inferredTopicType = lessonContext.topic_type || lessonContext.topicType
	const fallbackTopicType = lesson.type === 'PRACTICE' ? TopicTypeEnum.PRACTICAL : TopicTypeEnum.SNZ
	const resolvedTopicType = inferredTopicType || fallbackTopicType
	const LessonTypeIcon = topicTypeIcons[resolvedTopicType]
	const canRegenerate = Boolean(currentRupId && currentDisciplineId && currentTopicId)
	const lessonProgress = useMemo(
		() => normalizeLessonProgress(lessonContext.lesson_progress),
		[lessonContext.lesson_progress],
	)

	const resolveNonNegative = (...values: Array<number | undefined>) => {
		for (const value of values) {
			if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
		}

		return 0
	}

	const teacherName =
		[lesson.teacher?.lastName, lesson.teacher?.firstName].filter(Boolean).join(' ') ||
		lesson.teacher?.username ||
		lesson.teacher_id ||
		'Пусто'
	const teacherId = lesson.teacher?.keycloakId || lesson.teacher_id || ''
	const isAdmin = hasRole(userRole, RoleEnum.ADMIN)
	const isTeacherOwner = hasRole(userRole, RoleEnum.TEACHER, false) && userKeycloakId === teacherId
	const canManageLessonResolved = canManageLesson || isAdmin || isTeacherOwner
	const cardClassName = 'border-border/70 bg-card/90 shadow-sm shadow-black/5'
	const groupName = lesson.group?.name || lesson.group_id || 'Пусто'

	const resetRegenerateForm = () => {
		setRegenerateFormData({
			name: lesson.topic_name,
			theoryHours: resolveNonNegative(lessonContext.theory_hours, lessonContext.theoryHours),
			practiceHours: resolveNonNegative(lessonContext.practice_hours, lessonContext.practiceHours),
			individualHours: resolveNonNegative(lessonContext.individual_hours, lessonContext.individualHours),
			srspHours: resolveNonNegative(lessonContext.srsp_hours, lessonContext.srspHours),
			srsHours: resolveNonNegative(lessonContext.srs_hours, lessonContext.srsHours),
			type: inferredTopicType || fallbackTopicType,
		})
	}

	const handleDeleteLesson = () => {
		setIsDeleteDialogOpen(false)

		const toastId = `lesson-${lesson.id}-delete`

		toast.loading('Удаление урока...', { id: toastId })

		deleteLessonMutation.mutate(lesson.id, {
			onSuccess: () => {
				toast.success('Урок удален', { id: toastId })
				replace('/lessons/my')
			},
			onError: (err) => {
				toast.error('Ошибка при удалении урока', {
					description: err.message,
					id: toastId,
				})
			},
		})
	}

	const handleRegenerateClick = () => {
		resetRegenerateForm()
		setRegenerateDescription('')
		setIsRegenerateDialogOpen(true)
	}

	const handleRegenerate = async () => {
		if (!currentRupId || !currentDisciplineId || !currentTopicId) {
			toast.error('Недостаточно данных для перегенерации урока', {
				description: 'Требуются rupId, disciplineId и topicId из backend ответа.',
			})

			return
		}

		if (!regenerateFormData.name.trim()) {
			toast.error('Введите название темы')

			return
		}

		const payload = {
			rupId: currentRupId,
			disciplineId: currentDisciplineId,
			topicId: currentTopicId,
			updatedTopic: {
				name: createLocaleText(regenerateFormData.name.trim(), regenerateFormData.name.trim()),
				description: regenerateDescription.trim(),
				type: regenerateFormData.type,
				total_hours:
					regenerateFormData.theoryHours + regenerateFormData.practiceHours + regenerateFormData.individualHours,
				theory_hours: regenerateFormData.theoryHours,
				practice_hours: regenerateFormData.practiceHours,
				individual_hours: regenerateFormData.individualHours,
				srsp_hours: regenerateFormData.srspHours,
				srs_hours: regenerateFormData.srsHours,
			},
		}

		const toastId = `lesson-${lesson.id}-regenerate`

		toast.loading('Перегенерация урока...', { id: toastId })

		try {
			const response = await regenerateLessonMutation.mutateAsync(payload)

			if (!response.status) {
				toast.error('Не удалось перегенерировать урок', { id: toastId })

				return
			}

			toast.success('Урок успешно перегенерирован', { id: toastId })
			setIsRegenerateDialogOpen(false)

			if (response.lessonId) {
				push(`/lessons/${response.lessonId}`)
			}
		} catch (err) {
			toast.error('Ошибка при перегенерации урока', {
				description: err instanceof Error ? err.message : 'Unknown error',
				id: toastId,
			})
		}
	}

	return (
		<section className='relative mx-auto w-full max-w-7xl space-y-6 p-4 sm:space-y-7 sm:p-6 lg:p-8'>
			<div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
				<div className='absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl' />
				<div className='absolute bottom-8 left-20 h-56 w-56 rounded-full bg-secondary/10 blur-3xl' />
			</div>

			<PageTitle
				sticky
				actions={
					<div className='flex flex-col justify-end items-end gap-3'>
						<ButtonGroup>
							{canManageLessonResolved && (
								<Button
									className='hover:text-primary'
									disabled={!canRegenerate || regenerateLessonMutation.isPending}
									size='sm'
									variant='outline'
									onClick={handleRegenerateClick}
								>
									<RefreshCw className='mr-2 h-4 w-4' />
									Перегенерировать
								</Button>
							)}
							{lesson.file_url && (
								<Button asChild size='sm' variant='outline'>
									<Link href={lesson.file_url} rel='noopener noreferrer' target='_blank'>
										<FileDown className='mr-2 h-4 w-4' />
										Открыть файл
									</Link>
								</Button>
							)}
						</ButtonGroup>
						<ButtonGroup>
							{canManageLessonResolved && (
								<Button asChild size='sm' variant='outline'>
									<Link href={`/lessons/${lesson.id}/edit`}>
										<Edit className='mr-2 h-4 w-4' />
										Редактировать
									</Link>
								</Button>
							)}
							{canManageLessonResolved && (
								<Button
									className='hover:text-destructive'
									disabled={deleteLessonMutation.isPending}
									size='sm'
									variant='outline'
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<Trash className='mr-2 h-4 w-4' />
									Удалить
								</Button>
							)}
						</ButtonGroup>
					</div>
				}
				backHref='/lessons/my'
				description='Детальная информация по уроку'
			>
				{lesson.topic_name}
			</PageTitle>

			<LessonOverviewGrid
				cardClassName={cardClassName}
				groupName={groupName}
				lesson={lesson}
				lessonTypeIcon={LessonTypeIcon}
				resolvedTopicTypeLabel={resolvedTopicType}
				teacherId={teacherId}
				teacherName={teacherName}
			/>

			<LessonGoalsGrid cardClassName={cardClassName} lesson={lesson} />

			<LessonProgressCard cardClassName={cardClassName} lessonProgress={lessonProgress} />

			<LessonResourcesGrid cardClassName={cardClassName} lesson={lesson} />

			<LessonDeleteDialog
				isOpen={isDeleteDialogOpen}
				onConfirm={handleDeleteLesson}
				onOpenChange={setIsDeleteDialogOpen}
			/>

			<LessonRegenerateDialog
				canRegenerate={canRegenerate}
				description={regenerateDescription}
				isOpen={isRegenerateDialogOpen}
				isPending={regenerateLessonMutation.isPending}
				onConfirm={handleRegenerate}
				onDescriptionChange={setRegenerateDescription}
				onOpenChange={setIsRegenerateDialogOpen}
			/>
		</section>
	)
}
