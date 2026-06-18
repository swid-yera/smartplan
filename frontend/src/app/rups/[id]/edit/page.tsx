'use client'

import { type FC, type KeyboardEvent, useEffect, useMemo, useState } from 'react'

import { notFound, useParams, useRouter } from 'next/navigation'

import {
	Forbidden,
	Loader,
	LocaleToggleButton,
	PageTitle,
	type PageTitleAction,
	PageTitleActions,
	withPermission,
} from '@components'
import {
	createLocaleText,
	getLocaleText,
	getTopicDurationHours,
	getUILocaleSection,
	hasAnyPermission,
	hasPermission,
	interpolateUILocaleText,
	isAuthor,
} from '@helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUnsavedChangesGuard } from '@hooks'
import { cn } from '@lib'
import { services } from '@services'
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
	type IApiErrorResponse,
	type IUpdateRupRequest,
	type Locale,
	PermissionCodeEnum,
	RupTypeEnum,
	StudyFormEnum,
} from '@types'
import { isAxiosError } from 'axios'
import { BookOpen, RotateCcw, SaveIcon } from 'lucide-react'
import { type FieldErrors, FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Step1 } from '../../create/step1'
import { Step2 } from '../../create/step2'
import { Step3 } from '../../create/step3'
import { Step4 } from '../../create/step4'
import { toLocaleText } from '../../rup-localization'
import { type RUPFormData, createRupFormSchema } from '../../rup-schema'
import localeDictionary from './locale.json'

const defaultValues: RUPFormData = {
	name: { ru: '', kz: '' },

	type: RupTypeEnum.PRACTICE,
	studyForm: StudyFormEnum.FULL_TIME,
	studyYear: '2025-2026',
	groupId: '',
	course: 1,

	basis: { ru: '', kz: '' },
	goals: { ru: '', kz: '' },
	competencies: { ru: '', kz: '' },

	prerequisites: { ru: '', kz: '' },
	postrequisites: { ru: '', kz: '' },
	internetResources: [],
	technicalResources: [],

	contacts: [], // default creator id :(
	disciplines: [],
}

const EditPage: FC = () => {
	const { replace } = useRouter()
	const { id } = useParams<{ id: string }>()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [currentStep, setCurrentStep] = useState('1')
	const [stepTransitionDirection, setStepTransitionDirection] = useState<'forward' | 'backward'>('forward')
	const [activeLocale, setActiveLocale] = useState<Locale>(locale)
	// auth
	const { user, authLoading } = useAuthStore()
	// queries
	const { data: rupData, isLoading } = useQuery({ ...services.rup.getByIdOptions(id), enabled: !!id })
	const { data: generationStatus, isLoading: isGenerationStatusLoading } = useQuery({
		...services.rup.getLanguageGenerationStatusOptions(id),
		enabled: !!id,
	})
	// mutations
	const updateMutation = useMutation(services.rup.updateOptions())

	useEffect(() => {
		setActiveLocale(locale)
	}, [locale])

	const isLanguageGenerationInProgress =
		generationStatus?.status === 'queued' || generationStatus?.status === 'running'

	useEffect(() => {
		if (!isLanguageGenerationInProgress) return
		replace(`/rups/${id}/language-generation`)
	}, [id, isLanguageGenerationInProgress, replace])

	// form
	const formSchema = useMemo(() => createRupFormSchema(locale), [locale])
	const methods = useForm<RUPFormData>({
		resolver: zodResolver(formSchema),
		mode: 'onBlur',
		reValidateMode: 'onChange',
		shouldUnregister: false,
		defaultValues,
	})

	const mappedRupValues = useMemo<RUPFormData | null>(() => {
		if (!rupData) return null

		return {
			...rupData,
			name: toLocaleText(rupData.name),
			prerequisites: toLocaleText(rupData.explorationNote?.prerequisites),
			postrequisites: toLocaleText(rupData.explorationNote?.postrequisites),
			basis: toLocaleText(rupData.explorationNote?.basis),
			goals: toLocaleText(rupData.explorationNote?.goals),
			competencies: toLocaleText(rupData.explorationNote?.competencies),
			internetResources:
				rupData.explorationNote?.internetResources?.map((r) => ({
					name: toLocaleText(r.name),
					link: r.link ?? '',
				})) ?? [],
			technicalResources:
				rupData.explorationNote?.technicalResources?.map((r) => ({
					name: toLocaleText(r.name),
					link: r.link ?? '',
				})) ?? [],
			disciplines:
				rupData.disciplines?.map((discipline) => {
					return {
						name: toLocaleText(discipline.name),
						semesters: discipline.semesters.map((semester) => ({
							semester: semester.semester,
							totalHours: semester.totalHours,
						})),
						topics: discipline.topics.map((topic) => ({
							...topic,
							name: toLocaleText(topic.name),
							durationHours: getTopicDurationHours(topic),
						})),
					}
				}) ?? [],
			groupId: rupData.groups[0]?.keycloakId,
			contacts: rupData.contacts.map((c) => c.keycloakId),
		}
	}, [rupData])

	// form update default values
	useEffect(() => {
		if (!mappedRupValues) return

		methods.reset(mappedRupValues, { keepDirty: false, keepTouched: false })
	}, [mappedRupValues, methods])

	const collectFieldMessages = (errors: FieldErrors<RUPFormData>): string[] => {
		const messages: string[] = []

		const walk = (value: unknown) => {
			if (!value) return

			if (Array.isArray(value)) {
				value.forEach(walk)

				return
			}

			if (typeof value !== 'object') return

			const record = value as Record<string, unknown> & { message?: unknown }

			if (typeof record.message === 'string' && record.message.trim()) {
				messages.push(record.message)
			}

			Object.entries(record).forEach(([key, nested]) => {
				if (key === 'message' || key === 'type' || key === 'ref') return
				walk(nested)
			})
		}

		walk(errors)

		return [...new Set(messages)]
	}

	const { confirmNavigation } = useUnsavedChangesGuard(methods.formState.isDirty, t.unsavedChangesMessage)

	const onSubmit = (newData: RUPFormData) => {
		if (!rupData) return

		// mapped disciplines
		const mappedDisciplines = newData.disciplines.map((discipline) => ({
			...discipline,
			name: createLocaleText(discipline.name.ru.trim(), discipline.name.kz.trim()),
			topics: discipline.topics.map((topic) => ({
				...topic,
				name: createLocaleText(topic.name.ru.trim(), topic.name.kz.trim()),
				// Normalize optional numeric fields for backend payload.
				durationHours: topic.durationHours ?? getTopicDurationHours(topic),
				individualHours: topic.individualHours ?? 0,
				srspHours: topic.srspHours ?? 0,
				srsHours: topic.srsHours ?? 0,
			})),
		}))

		// mapped data
		const mappedData: IUpdateRupRequest = {
			...newData,
			name: createLocaleText(newData.name.ru.trim(), newData.name.kz.trim()),
			groups: [newData.groupId],
			// @ts-ignore
			teacher: rupData?.teacher.id ?? user?.keycloakID,
			explorationNote: {
				basis: createLocaleText(newData.basis.ru.trim(), newData.basis.kz.trim()),
				goals: createLocaleText(newData.goals.ru.trim(), newData.goals.kz.trim()),
				competencies: createLocaleText(newData.competencies.ru.trim(), newData.competencies.kz.trim()),

				prerequisites: createLocaleText(newData.prerequisites.ru.trim(), newData.prerequisites.kz.trim()),
				postrequisites: createLocaleText(newData.postrequisites.ru.trim(), newData.postrequisites.kz.trim()),

				internetResources: newData.internetResources.map((resource) => ({
					...resource,
					name: createLocaleText(resource.name.ru.trim(), resource.name.kz.trim()),
					link: resource.link?.trim() || '',
				})),
				technicalResources: newData.technicalResources.map((resource) => ({
					...resource,
					name: createLocaleText(resource.name.ru.trim(), resource.name.kz.trim()),
					link: resource.link?.trim() || '',
				})),
			},
			disciplines: mappedDisciplines,
		}

		const toastId = `rup-${rupData.id}-update`
		const rupName = getLocaleText(mappedData.name, activeLocale)

		toast.loading(t.loadingSave, { id: toastId })

		updateMutation.mutate(
			{ id: rupData.id, changedRup: mappedData },
			{
				onSuccess: (updatedRup) => {
					toast.success(
						interpolateUILocaleText(t.saveSuccess, { name: getLocaleText(updatedRup.name, activeLocale) }),
						{ id: toastId },
					)
					replace(`/rups/${updatedRup.id}`)
				},
				onError: (err) => {
					let errorMessage = err.message

					if (isAxiosError<IApiErrorResponse>(err)) {
						const details = err.response?.data?.details
						const backendError = err.response?.data?.error

						errorMessage =
							(typeof details === 'string' && details.trim()) ||
							(typeof backendError === 'string' && backendError.trim()) ||
							errorMessage
					}

					toast.error(interpolateUILocaleText(t.saveError, { name: rupName }), {
						id: toastId,
						description: errorMessage,
					})
				},
			},
		)
	}

	const onInvalid = (errors: FieldErrors<RUPFormData>) => {
		const firstMessage = collectFieldMessages(errors)[0]

		toast.error(t.fieldsError, {
			description: firstMessage,
		})
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	if (isLoading || authLoading || isGenerationStatusLoading || isLanguageGenerationInProgress) return <Loader />
	if (!user) return notFound()
	if (!rupData) notFound()
	const canFullAccess = hasPermission(user, PermissionCodeEnum.RUP_FULL)
	const canManage = hasAnyPermission(user, [PermissionCodeEnum.RUP_MANAGE])
	const isRupCreator = isAuthor(user, rupData.teacher.keycloakId)
	const isRupDeveloper = isRupCreator || rupData.contacts.some((contact) => contact.keycloakId === user.keycloakId)

	// Redirect if not allowed to edit
	if (!isRupDeveloper && !canManage && !canFullAccess) return <Forbidden />

	const getStepTransitionDirection = (fromStep: string, toStep: string) =>
		Number(toStep) >= Number(fromStep) ? 'forward' : 'backward'

	const handleStepChange = (newStep: string) => {
		if (newStep === currentStep) return

		setStepTransitionDirection(getStepTransitionDirection(currentStep, newStep))
		setCurrentStep(newStep)
	}

	const pageActions: PageTitleAction[] = [
		{
			id: 'save',
			label: t.save,
			icon: SaveIcon,
			onClick: methods.handleSubmit(onSubmit, onInvalid),
			disabled: !methods.formState.isDirty,
			priority: 'primary',
		},
		{
			id: 'open-view',
			label: t.openView,
			icon: BookOpen,
			href: `/rups/${rupData.id}`,
			priority: 'overflow',
		},
		{
			id: 'reset',
			label: t.resetChanges,
			icon: RotateCcw,
			onClick: () => methods.reset(),
			disabled: !methods.formState.isDirty,
			variant: 'destructive',
			priority: 'overflow',
		},
	]

	return (
		<FormProvider {...methods}>
			<form
				className='w-full mx-auto px-4 py-6 space-y-4'
				onKeyDown={handleKeyDown}
				onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
			>
				<PageTitle
					sticky
					actions={
						<PageTitleActions
							actions={pageActions}
							moreLabel={t.moreActions}
							trailing={
								<LocaleToggleButton
									activeLocale={activeLocale}
									labels={{ kk: t.languages.kk, ru: t.languages.ru }}
									onChangeLocale={setActiveLocale}
								/>
							}
						/>
					}
					backHref='back'
					description={t.description}
					onBackClick={confirmNavigation}
				>
					{t.titlePrefix}: {getLocaleText(rupData.name, activeLocale) || t.titleFallback}{' '}
					<Badge variant='outline'>{t.draft}</Badge>
				</PageTitle>

				<Tabs value={currentStep} onValueChange={handleStepChange}>
					<TabsList className='grid grid-cols-4 w-full'>
						<TabsTrigger value='1'>{t.step1}</TabsTrigger>
						<TabsTrigger value='2'>{t.step2}</TabsTrigger>
						<TabsTrigger value='3'>{t.step3}</TabsTrigger>
						<TabsTrigger value='4'>{t.step4}</TabsTrigger>
					</TabsList>

					<TabsContent
						className={cn(
							'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300 motion-reduce:data-[state=active]:animate-none',
							stepTransitionDirection === 'forward'
								? 'data-[state=active]:slide-in-from-right-4'
								: 'data-[state=active]:slide-in-from-left-4',
						)}
						value='1'
					>
						<Step1 activeLocale={activeLocale} />
					</TabsContent>
					<TabsContent
						className={cn(
							'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300 motion-reduce:data-[state=active]:animate-none',
							stepTransitionDirection === 'forward'
								? 'data-[state=active]:slide-in-from-right-4'
								: 'data-[state=active]:slide-in-from-left-4',
						)}
						value='2'
					>
						<Step2 activeLocale={activeLocale} />
					</TabsContent>
					<TabsContent
						className={cn(
							'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300 motion-reduce:data-[state=active]:animate-none',
							stepTransitionDirection === 'forward'
								? 'data-[state=active]:slide-in-from-right-4'
								: 'data-[state=active]:slide-in-from-left-4',
						)}
						value='3'
					>
						<Step3 activeLocale={activeLocale} />
					</TabsContent>
					<TabsContent
						className={cn(
							'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300 motion-reduce:data-[state=active]:animate-none',
							stepTransitionDirection === 'forward'
								? 'data-[state=active]:slide-in-from-right-4'
								: 'data-[state=active]:slide-in-from-left-4',
						)}
						value='4'
					>
						<Step4 activeLocale={activeLocale} />
					</TabsContent>
				</Tabs>
			</form>
		</FormProvider>
	)
}

export default withPermission(EditPage, [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.RUP_VIEW])
