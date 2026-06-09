'use client'

import { type FC, type KeyboardEvent, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { Forbidden, Loader, PageTitle, withRole } from '@components'
import { createLocaleText, getLocaleText, getUILocaleSection, interpolateUILocaleText, isAuthor } from '@helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@lib'
import { services } from '@services'
import {
	Badge,
	Button,
	ButtonGroup,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateRupRequest, type Locale, RoleEnum, RupTypeEnum, StudyFormEnum } from '@types'
import { MoreVertical, RotateCcw, SaveIcon } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
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

const LanguageTabs = ({
	value,
	onChange,
	labels,
}: {
	value: Locale
	onChange: (locale: Locale) => void
	labels: { ru: string; kk: string }
}) => (
	<Tabs value={value} onValueChange={(next) => onChange(next as Locale)}>
		<TabsList>
			<TabsTrigger value='ru'>{labels.ru}</TabsTrigger>
			<TabsTrigger value='kk'>{labels.kk}</TabsTrigger>
		</TabsList>
	</Tabs>
)

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
				rupData.disciplines?.map((discipline) => ({
					...discipline,
					name: toLocaleText(discipline.name),
					topics: discipline.topics.map((topic) => ({
						...topic,
						name: toLocaleText(topic.name),
					})),
				})) ?? [],
			groupId: rupData.groups[0]?.keycloakId,
			contacts: rupData.contacts.map((c) => c.keycloakId),
		}
	}, [rupData])

	// form update default values
	useEffect(() => {
		if (!mappedRupValues) return

		methods.reset(mappedRupValues, { keepDirty: false, keepTouched: false })
	}, [mappedRupValues, methods])

	// Warn user about unsaved changes before leaving the page.
	// NOTE: This works for page reloads, closing the tab, or navigating away.
	// It does not prevent client-side navigation via <Link> in Next.js App Router without more complex handling.
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (methods.formState.isDirty) {
				e.preventDefault()
				e.returnValue = '' // Required for legacy browsers, modern browsers show a generic message.
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload)

		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [methods.formState.isDirty])

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
					toast.error(interpolateUILocaleText(t.saveError, { name: rupName }), {
						id: toastId,
						description: err.message,
					})
				},
			},
		)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	if (isLoading || authLoading || isGenerationStatusLoading || isLanguageGenerationInProgress) return <Loader />
	if (!user) return notFound()
	if (!rupData) notFound()
	const isRupCreator = isAuthor(user, rupData.teacher.keycloakId)
	const isRupDeveloper = isRupCreator || rupData.contacts.some((contact) => contact.keycloakId === user.keycloakId)
	// Redirect if not allowed to edit

	if (!isRupDeveloper) return <Forbidden />
	const isAdmin = user.role === RoleEnum.ADMIN
	const isTeacher = user.role === RoleEnum.TEACHER
	const isMethodist = user.role === RoleEnum.METHODIST

	const getStepTransitionDirection = (fromStep: string, toStep: string) =>
		Number(toStep) >= Number(fromStep) ? 'forward' : 'backward'

	const handleStepChange = (newStep: string) => {
		if (newStep === currentStep) return

		setStepTransitionDirection(getStepTransitionDirection(currentStep, newStep))
		setCurrentStep(newStep)
	}

	return (
		<FormProvider {...methods}>
			<form
				className='w-full mx-auto px-4 py-6 space-y-4'
				onKeyDown={handleKeyDown}
				onSubmit={methods.handleSubmit(onSubmit)}
			>
				<PageTitle
					sticky
					actions={
						<div className='flex flex-wrap items-center justify-end gap-2'>
							<LanguageTabs
								labels={{ kk: t.languages.kk, ru: t.languages.ru }}
								value={activeLocale}
								onChange={setActiveLocale}
							/>
							<ButtonGroup>
								{isAdmin && (
									<Button
										className='hover:text-destructive'
										disabled={!methods.formState.isDirty}
										type='button'
										variant='outline'
										onClick={() => methods.reset()}
									>
										<RotateCcw className='mr-2 h-4 w-4' />
										{t.resetChanges}
									</Button>
								)}
								<Button
									className='hover:text-primary'
									disabled={!methods.formState.isDirty}
									type='submit'
									variant='outline'
								>
									<SaveIcon className='mr-2 h-4 w-4' />
									{t.save}
								</Button>
							</ButtonGroup>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button aria-label={t.moreActions} className='size-9 px-0' type='button' variant='outline'>
										<MoreVertical className='h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-56'>
									<DropdownMenuItem asChild>
										<Link href={`/rups/${rupData.id}`}>{t.openView}</Link>
									</DropdownMenuItem>
									{!isAdmin && (isTeacher || isMethodist) && (
										<DropdownMenuItem className='cursor-pointer' onClick={() => methods.reset()}>
											<RotateCcw className='mr-2 h-4 w-4' />
											{t.resetChanges}
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					}
					backHref={`/rups/${rupData.id}`}
					description={t.description}
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

export default withRole(EditPage, [RoleEnum.TEACHER, RoleEnum.METHODIST])
