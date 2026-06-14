'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { getLocaleText, getUILocaleSection, hasRole, toBackendLocale, toDateOnlyIso, topicTypeIcons } from '@helpers'
import { services } from '@services'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ILesson, Locale } from '@types'
import { RoleEnum, TopicTypeEnum } from '@types'
import { toast } from 'sonner'

import { RupLanguageDialog } from '../../dialogs/rup-language-dialog'
import { PageTitle } from '../../ui/page-title'
import { LessonDeleteDialog, LessonRegenerateDialog } from './lesson-action-dialogs'
import { LessonDetailsActions } from './lesson-details-actions'
import { LessonGoalsGrid } from './lesson-goals-grid'
import { LessonOverviewGrid } from './lesson-overview-grid'
import { type ILessonContext, type IRegenerateFormData } from './lesson-page.types'
import { normalizeLessonProgress } from './lesson-page.utils'
import { LessonProgressCard } from './lesson-progress-card'
import { LessonResourcesGrid } from './lesson-resources-grid'
import localeDictionary from './locale.json'

type IProps = {
	activeLocale: Locale
	canManageLesson: boolean
	lesson: ILesson
	onActiveLocaleChange: (locale: Locale) => void
	userRole: RoleEnum
	userKeycloakId: string
}

export function LessonDetailsContent({
	activeLocale,
	canManageLesson,
	lesson,
	onActiveLocaleChange,
	userKeycloakId,
	userRole,
}: IProps) {
	const t = getUILocaleSection(localeDictionary, activeLocale)
	const { back, push } = useRouter()
	const queryClient = useQueryClient()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isDownloadLanguageDialogOpen, setIsDownloadLanguageDialogOpen] = useState(false)
	const [isDownloadPending, setIsDownloadPending] = useState(false)
	const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)
	const [regenerateDescription, setRegenerateDescription] = useState('')
	const [regenerateEventDate, setRegenerateEventDate] = useState<Date | undefined>(undefined)
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
		() => normalizeLessonProgress(lessonContext.lesson_progress, activeLocale),
		[activeLocale, lessonContext.lesson_progress],
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
		t.empty
	const teacherId = lesson.teacher?.keycloakId || lesson.teacher_id || ''
	const isAdmin = hasRole(userRole, RoleEnum.ADMIN)
	const isTeacherOwner = hasRole(userRole, RoleEnum.TEACHER, false) && userKeycloakId === teacherId
	const canManageLessonResolved = canManageLesson || isAdmin || isTeacherOwner
	const canDownload = true
	const cardClassName = 'border-border/70 bg-card/90 shadow-sm shadow-black/5'
	const groupName = lesson.group?.name || lesson.group_id || t.empty

	const resetRegenerateForm = () => {
		setRegenerateFormData({
			name: getLocaleText(lesson.topic_name, activeLocale),
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

		toast.loading(t.deletingLesson, { id: toastId })

		deleteLessonMutation.mutate(lesson.id, {
			onSuccess: () => {
				toast.success(t.lessonDeleted, { id: toastId })
				back()
			},
			onError: (err) => {
				toast.error(t.deleteLessonError, {
					description: err.message,
					id: toastId,
				})
			},
		})
	}

	const handleRegenerateClick = () => {
		resetRegenerateForm()
		setRegenerateDescription('')
		const currentEventDate = lesson.event_date ? new Date(lesson.event_date) : new Date()

		setRegenerateEventDate(Number.isNaN(currentEventDate.getTime()) ? new Date() : currentEventDate)
		setIsRegenerateDialogOpen(true)
	}

	const handleRegenerate = async () => {
		if (!currentRupId || !currentDisciplineId || !currentTopicId) {
			toast.error(t.notEnoughLessonData, {
				description: t.notEnoughLessonDataDescription,
			})

			return
		}

		if (!regenerateFormData.name.trim()) {
			toast.error(t.enterLessonTopic)

			return
		}

		const payload = {
			rupId: currentRupId,
			disciplineId: currentDisciplineId,
			topicId: currentTopicId,
			sourceLanguage: toBackendLocale(activeLocale),
			message: regenerateDescription.trim(),
			event_date: toDateOnlyIso(regenerateEventDate),
			updatedTopic: {
				name: {
					ru: activeLocale === 'ru' ? regenerateFormData.name.trim() : getLocaleText(lesson.topic_name, 'ru'),
					kz: activeLocale === 'kk' ? regenerateFormData.name.trim() : getLocaleText(lesson.topic_name, 'kk'),
				},
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

		toast.loading(t.regeneratingLesson, { id: toastId })

		try {
			const response = await regenerateLessonMutation.mutateAsync(payload)

			if (!response.status) {
				toast.error(t.regenerateLessonError, { id: toastId })

				return
			}

			toast.success(t.lessonRegenerated, { id: toastId })
			setIsRegenerateDialogOpen(false)

			if (response.lessonId) {
				push(`/lessons/${response.lessonId}`)
			}
		} catch (err) {
			toast.error(t.regenerateLessonError, {
				description: err instanceof Error ? err.message : 'Unknown error',
				id: toastId,
			})
		}
	}

	const handleDownload = (downloadLanguage: Locale) => {
		setIsDownloadPending(true)

		toast.promise(
			async () => {
				try {
					const data = await queryClient.fetchQuery(
						services.lesson.getDownloadUrlOptions(lesson.id, toBackendLocale(downloadLanguage)),
					)

					if (!data) throw new Error(t.lessonFileLinkError)

					const link = document.createElement('a')

					link.href = data.url
					link.setAttribute(
						'download',
						`${getLocaleText(lesson.topic_name, downloadLanguage) || 'lesson_plan'}.docx`,
					)
					document.body.appendChild(link)
					link.click()
					link.remove()
					setIsDownloadLanguageDialogOpen(false)
				} finally {
					setIsDownloadPending(false)
				}
			},
			{
				loading: t.downloadingLessonFile,
				success: t.lessonFileDownloaded,
				error: t.lessonFileDownloadError,
			},
		)
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
					<LessonDetailsActions
						activeLocale={activeLocale}
						canDelete={canManageLessonResolved}
						canDownload={canDownload}
						canEdit={canManageLessonResolved}
						canRegenerate={canManageLessonResolved && canRegenerate}
						isDeletePending={deleteLessonMutation.isPending}
						isDownloadPending={isDownloadPending}
						isRegeneratePending={regenerateLessonMutation.isPending}
						lessonId={lesson.id}
						onActiveLocaleChange={onActiveLocaleChange}
						onDelete={() => setIsDeleteDialogOpen(true)}
						onDownload={() => setIsDownloadLanguageDialogOpen(true)}
						onRegenerate={handleRegenerateClick}
					/>
				}
				backHref='back'
				description={t.pageDescription}
			>
				{getLocaleText(lesson.topic_name, activeLocale) || t.lessonUntitled}
			</PageTitle>

			<LessonOverviewGrid
				cardClassName={cardClassName}
				groupName={groupName}
				lesson={lesson}
				lessonLocale={activeLocale}
				lessonTypeIcon={LessonTypeIcon}
				resolvedTopicTypeLabel={resolvedTopicType}
				teacherId={teacherId}
				teacherName={teacherName}
			/>

			<LessonGoalsGrid cardClassName={cardClassName} lesson={lesson} lessonLocale={activeLocale} />

			<LessonProgressCard
				cardClassName={cardClassName}
				lessonLocale={activeLocale}
				lessonProgress={lessonProgress}
			/>

			<LessonResourcesGrid cardClassName={cardClassName} lesson={lesson} lessonLocale={activeLocale} />

			<LessonDeleteDialog
				isOpen={isDeleteDialogOpen}
				onConfirm={handleDeleteLesson}
				onOpenChange={setIsDeleteDialogOpen}
			/>

			<LessonRegenerateDialog
				canRegenerate={canRegenerate}
				description={regenerateDescription}
				eventDate={regenerateEventDate}
				isOpen={isRegenerateDialogOpen}
				isPending={regenerateLessonMutation.isPending}
				onConfirm={handleRegenerate}
				onDescriptionChange={setRegenerateDescription}
				onEventDateChange={setRegenerateEventDate}
				onOpenChange={setIsRegenerateDialogOpen}
			/>

			<RupLanguageDialog
				confirmLabel={t.openFile}
				currentLanguage={activeLocale}
				description={t.downloadLanguageDialogDescription}
				isPending={isDownloadPending}
				languageLabels={{ kk: t.languageKk, ru: t.languageRu }}
				open={isDownloadLanguageDialogOpen}
				title={t.downloadLanguageDialogTitle}
				onConfirm={handleDownload}
				onOpenChange={setIsDownloadLanguageDialogOpen}
			/>
		</section>
	)
}
