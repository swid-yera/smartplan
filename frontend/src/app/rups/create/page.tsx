'use client'

import { type JSX, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

import type { NextPage } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, RupLanguageDialog, withRole } from '@components'
import {
	createLocaleText,
	getLocaleText,
	getUILocaleSection,
	interpolateUILocaleText,
	isSiteLocale,
	toBackendLocale,
} from '@helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@lib'
import { services } from '@services'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation } from '@tanstack/react-query'
import {
	type ICreateRupRequest,
	type Locale,
	type LocaleText,
	RoleEnum,
	RupTypeEnum,
	StudyFormEnum,
	TopicTypeEnum,
} from '@types'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { toLocaleText } from '../rup-localization'
import { type RUPFormData, createRupFormSchema } from '../rup-schema'
import localeDictionary from './locale.json'
import { Step1 } from './step1'
import { Step2 } from './step2'
import { Step3 } from './step3'
import { Step4 } from './step4'

const LOCAL_STORAGE_KEY = 'rup-create-form-data'
const HIGHEST_STEP_STORAGE_KEY = 'rup-create-highest-step'
const CREATE_LANGUAGE_STORAGE_KEY = 'rup-create-language'

const defaultValues: RUPFormData = {
	name: { ru: '', kz: '' },
	type: RupTypeEnum.THEORY,
	studyForm: StudyFormEnum.FULL_TIME,
	studyYear: '',

	basis: { ru: '', kz: '' },
	goals: { ru: '', kz: '' },
	competencies: { ru: '', kz: '' },
	course: 0,

	prerequisites: { ru: '', kz: '' },
	postrequisites: { ru: '', kz: '' },

	internetResources: [],
	technicalResources: [],

	groupId: '',
	contacts: [],
	disciplines: [],
}

const normalizeStoredRupData = (raw: unknown): RUPFormData => {
	if (!raw || typeof raw !== 'object') return defaultValues

	const draft = raw as Partial<RUPFormData> & Record<string, unknown>
	const disciplines = Array.isArray(draft.disciplines) ? draft.disciplines : []
	const internetResources = Array.isArray(draft.internetResources) ? draft.internetResources : []
	const technicalResources = Array.isArray(draft.technicalResources) ? draft.technicalResources : []

	return {
		...defaultValues,
		...draft,
		name: toLocaleText(draft.name),
		prerequisites: toLocaleText(draft.prerequisites),
		postrequisites: toLocaleText(draft.postrequisites),
		basis: toLocaleText(draft.basis),
		goals: toLocaleText(draft.goals),
		competencies: toLocaleText(draft.competencies),
		internetResources: internetResources.map((resource) => ({
			...(resource as Record<string, unknown>),
			name: toLocaleText((resource as { name?: unknown }).name as Parameters<typeof toLocaleText>[0]),
			link: String((resource as { link?: string }).link ?? ''),
		})),
		technicalResources: technicalResources.map((resource) => ({
			...(resource as Record<string, unknown>),
			name: toLocaleText((resource as { name?: unknown }).name as Parameters<typeof toLocaleText>[0]),
			link: String((resource as { link?: string }).link ?? ''),
		})),
		disciplines: disciplines.map((discipline) => {
			const typedDiscipline = discipline as Record<string, unknown>
			const semesters = Array.isArray(typedDiscipline.semesters) ? typedDiscipline.semesters : []
			const topics = Array.isArray(typedDiscipline.topics) ? typedDiscipline.topics : []

			return {
				...typedDiscipline,
				name: toLocaleText(typedDiscipline.name as Parameters<typeof toLocaleText>[0]),
				semesters: semesters.map((semester) => ({
					semester: Number((semester as { semester?: number }).semester) || 0,
					totalHours: Number((semester as { totalHours?: number }).totalHours) || 0,
				})),
				topics: topics.map((topic) => ({
					...topic,
					name: toLocaleText((topic as { name?: unknown }).name as Parameters<typeof toLocaleText>[0]),
					type: (topic as { type?: string }).type ?? TopicTypeEnum.PRACTICAL,
					theoryHours: Number((topic as { theoryHours?: number }).theoryHours) || 0,
					practiceHours: Number((topic as { practiceHours?: number }).practiceHours) || 0,
					individualHours: Number((topic as { individualHours?: number }).individualHours) || 0,
					srspHours: Number((topic as { srspHours?: number }).srspHours) || 0,
					srsHours: Number((topic as { srsHours?: number }).srsHours) || 0,
				})),
			}
		}),
	}
}

const mapLocaleTextForCreate = (value: LocaleText, sourceLocale: Locale): LocaleText => {
	const sourceText = sourceLocale === 'ru' ? value.ru.trim() : value.kz.trim()

	if (sourceLocale === 'ru') {
		return { ru: sourceText, kz: '' }
	}

	return {
		ru: '',
		kz: sourceText,
	}
}

const Page: NextPage = () => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const pageT = t.page

	const [currentStep, setCurrentStep] = useState(searchParams.get('step') || '1')
	const [creationLocale, setCreationLocale] = useState<Locale | null>(null)
	const [highestStep, setHighestStep] = useState(Number(currentStep))
	const [stepTransitionDirection, setStepTransitionDirection] = useState<'forward' | 'backward'>('forward')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isHydrating, setIsHydrating] = useState(true)
	const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(true)

	const [isValidating, setIsValidating] = useState(false)
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)
	const currentStepRef = useRef(currentStep)
	const activeLocale: Locale = creationLocale ?? 'ru'

	const tabs: ITab[] = [
		{
			id: '1',
			title: pageT.step1Title,
			fullTitle: pageT.step1FullTitle,
			description: pageT.step1Description,
			content: <Step1 activeLocale={activeLocale} />,
		},
		{
			id: '2',
			title: pageT.step2Title,
			fullTitle: pageT.step2FullTitle,
			description: pageT.step2Description,
			content: <Step2 activeLocale={activeLocale} />,
		},
		{
			id: '3',
			title: pageT.step3Title,
			fullTitle: pageT.step3FullTitle,
			description: pageT.step3Description,
			content: <Step3 activeLocale={activeLocale} />,
		},
		{
			id: '4',
			title: pageT.step4Title,
			fullTitle: pageT.step4FullTitle,
			description: pageT.step4Description,
			content: <Step4 activeLocale={activeLocale} />,
		},
	]

	const createMutation = useMutation(services.rup.createOptions())
	const formSchema = useMemo(
		() => createRupFormSchema(locale, creationLocale ? [creationLocale] : ['ru']),
		[locale, creationLocale],
	)

	const methods = useForm<RUPFormData>({
		resolver: zodResolver(formSchema),
		mode: 'onSubmit',
		reValidateMode: 'onSubmit',
		shouldUnregister: false,
		defaultValues,
	})

	useEffect(() => {
		currentStepRef.current = currentStep
	}, [currentStep])

	useEffect(() => {
		const syncStepFromUrl = () => {
			const stepFromUrl = new URLSearchParams(window.location.search).get('step') || '1'

			if (stepFromUrl !== currentStepRef.current) {
				setStepTransitionDirection(getStepTransitionDirection(currentStepRef.current, stepFromUrl))
				setCurrentStep(stepFromUrl)
			}

			if (Number(stepFromUrl) > highestStep) setHighestStep(Number(stepFromUrl))
		}

		window.addEventListener('popstate', syncStepFromUrl)

		return () => window.removeEventListener('popstate', syncStepFromUrl)
	}, [highestStep])

	useEffect(() => {
		const savedData = window.localStorage.getItem(LOCAL_STORAGE_KEY)
		const savedLanguage = window.localStorage.getItem(CREATE_LANGUAGE_STORAGE_KEY)

		if (isSiteLocale(savedLanguage)) {
			setCreationLocale(savedLanguage)
			setIsLanguageDialogOpen(false)
		}

		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData)

				methods.reset(normalizeStoredRupData(parsedData))
			} catch (e) {
				console.error('Failed to parse or load form data', e)
				window.localStorage.removeItem(LOCAL_STORAGE_KEY)
			}
		}
		const savedHighestStep = window.localStorage.getItem(HIGHEST_STEP_STORAGE_KEY)

		if (savedHighestStep) setHighestStep(Number(savedHighestStep))

		setIsHydrating(false)
	}, [methods])

	useEffect(() => {
		if (isHydrating) return
		const subscription = methods.watch((value) => {
			try {
				if (value.name?.ru || value.name?.kz) window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value))
			} catch (e) {
				console.error('Failed to save form data', e)
			}
		})

		return () => subscription.unsubscribe()
	}, [methods, isHydrating])

	useEffect(() => {
		if (!isHydrating) window.localStorage.setItem(HIGHEST_STEP_STORAGE_KEY, String(highestStep))
	}, [highestStep, isHydrating])

	const currentIndex = tabs.findIndex((tab) => tab.id === currentStep)

	const getStepTransitionDirection = (fromStep: string, toStep: string) =>
		Number(toStep) >= Number(fromStep) ? 'forward' : 'backward'

	const handleStepChange = (newStep: string) => {
		if (newStep === currentStep) return

		const direction = getStepTransitionDirection(currentStep, newStep)

		setStepTransitionDirection(direction)
		setCurrentStep(newStep)
		window.history.pushState(null, '', `${pathname}?step=${newStep}`)
	}

	const onReset = () => {
		window.localStorage.removeItem(LOCAL_STORAGE_KEY)
		window.localStorage.removeItem(HIGHEST_STEP_STORAGE_KEY)
		window.localStorage.removeItem(CREATE_LANGUAGE_STORAGE_KEY)
		setCreationLocale(null)
		setIsLanguageDialogOpen(true)
		methods.reset(defaultValues)
	}

	const confirmCreationLanguage = (nextLocale: Locale) => {
		setCreationLocale(nextLocale)
		window.localStorage.setItem(CREATE_LANGUAGE_STORAGE_KEY, nextLocale)
		setIsLanguageDialogOpen(false)
	}

	const goNext = () => {
		if (currentIndex < tabs.length - 1) {
			handleStepChange(tabs[currentIndex + 1].id)
		}
	}

	const goBack = () => {
		if (currentIndex > 0) handleStepChange(tabs[currentIndex - 1].id)
	}

	const handlePreSave = async () => {
		if (!creationLocale) {
			setIsLanguageDialogOpen(true)

			return
		}

		setIsValidating(true)

		setTimeout(async () => {
			const isValid = await methods.trigger(undefined, { shouldFocus: true })

			setIsValidating(false)

			if (isValid) {
				setIsConfirmOpen(true)
			} else {
				toast.error(pageT.invalidForm)
			}
		}, 0)
	}

	const onSubmit = async (newData: RUPFormData) => {
		if (!creationLocale) {
			setIsLanguageDialogOpen(true)

			return
		}

		setIsConfirmOpen(false)
		setIsSubmitting(true)

		const mappedDisciplines = newData.disciplines.map((discipline) => ({
			...discipline,
			name: mapLocaleTextForCreate(discipline.name, creationLocale),
			topics: discipline.topics.map((topic) => ({
				...topic,
				name: mapLocaleTextForCreate(topic.name, creationLocale),
				individualHours: topic.individualHours ?? 0,
				srspHours: topic.srspHours ?? 0,
				srsHours: topic.srsHours ?? 0,
			})),
		}))

		const mappedExplorationNote = {
			basis: mapLocaleTextForCreate(newData.basis, creationLocale),
			goals: mapLocaleTextForCreate(newData.goals, creationLocale),
			competencies: mapLocaleTextForCreate(newData.competencies, creationLocale),
			summary: createLocaleText('', ''),
			prerequisites: mapLocaleTextForCreate(newData.prerequisites, creationLocale),
			postrequisites: mapLocaleTextForCreate(newData.postrequisites, creationLocale),
			internetResources: newData.internetResources.map((resource) => ({
				...resource,
				name: mapLocaleTextForCreate(resource.name, creationLocale),
				link: resource.link?.trim() || '',
			})),
			technicalResources: newData.technicalResources.map((resource) => ({
				...resource,
				name: mapLocaleTextForCreate(resource.name, creationLocale),
				link: resource.link?.trim() || '',
			})),
		}

		const mappedData: ICreateRupRequest = {
			...newData,
			name: mapLocaleTextForCreate(newData.name, creationLocale),
			sourceLanguage: toBackendLocale(creationLocale),
			groups: [newData.groupId],
			disciplines: mappedDisciplines,
			explorationNote: mappedExplorationNote,
		}

		const toastId = 'rup-create'
		const rupName = getLocaleText(mappedData.name, activeLocale)

		toast.loading(interpolateUILocaleText(pageT.createLoading, { name: rupName }), { id: toastId })

		createMutation.mutate(
			{ newRup: mappedData },
			{
				onSuccess: (createdRup) => {
					setIsSubmitting(false)
					window.localStorage.removeItem(LOCAL_STORAGE_KEY)
					window.localStorage.removeItem(HIGHEST_STEP_STORAGE_KEY)
					window.localStorage.removeItem(CREATE_LANGUAGE_STORAGE_KEY)
					toast.success(
						interpolateUILocaleText(pageT.createSuccess, {
							name: getLocaleText(createdRup.name, activeLocale),
						}),
						{ id: toastId },
					)
					router.push(`/rups/${createdRup.id}/language-generation`)
				},
				onError: (err) => {
					setIsSubmitting(false)
					toast.error(`${pageT.createErrorPrefix}: ${err.message}`, { id: toastId })
				},
			},
		)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	return (
		<FormProvider {...methods}>
			<RupLanguageDialog
				currentLanguage={creationLocale}
				description={pageT.languageDialogDescription}
				languageLabels={t.languages}
				open={isLanguageDialogOpen}
				required={!creationLocale}
				title={pageT.languageDialogTitle}
				onConfirm={confirmCreationLanguage}
				onOpenChange={(open) => {
					if (!creationLocale && !open) return
					setIsLanguageDialogOpen(open)
				}}
			/>

			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent className='duration-200 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'>
					<AlertDialogHeader>
						<AlertDialogTitle>{pageT.confirmSaveTitle}</AlertDialogTitle>
						<AlertDialogDescription>{pageT.confirmSaveDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>{pageT.cancel}</AlertDialogCancel>
						<AlertDialogAction disabled={isSubmitting} onClick={(e) => methods.handleSubmit(onSubmit)(e)}>
							{isSubmitting ? pageT.saving : pageT.save}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{isHydrating ? (
				<Loader type='data' />
			) : (
				<form onKeyDown={handleKeyDown} onSubmit={(e) => e.preventDefault()}>
					<Tabs className='w-full mx-auto px-4 py-6' value={currentStep} onValueChange={handleStepChange}>
						<TabsList className='flex w-full justify-between bg-background border-0 p-0 rounded-none my-5'>
							{tabs.map((step, index) => {
								const isCompleted = currentStep > step.id
								const isActive = currentStep === step.id
								const isDisabled = index + 1 > highestStep

								return (
									<div key={step.id} className='relative flex flex-1 flex-col items-center'>
										<TabsTrigger
											className='group flex flex-col items-center gap-2 bg-transparent! border-0 p-0 shadow-none!'
											disabled={isDisabled}
											type='button'
											value={step.id}
										>
											<div
												className={cn(
													'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300',
													isCompleted
														? 'bg-primary text-primary-foreground'
														: isActive
															? 'bg-primary text-primary-foreground'
															: 'bg-accent text-accent-foreground',
												)}
											>
												{isCompleted ? <Check className='h-5 w-5' /> : step.id}
											</div>
											<div
												className={cn(
													'text-center text-sm font-medium transition-colors',
													isActive || isCompleted ? 'text-primary' : 'text-accent-foreground',
												)}
											>
												{step.title}
											</div>
										</TabsTrigger>
										{index < tabs.length - 1 && (
											<div
												className={cn(
													'absolute top-5 left-[calc(50%+20px)] h-0.5 w-[calc(100%-40px)] -translate-y-1/2 bg-accent transition-colors duration-300',
													isCompleted && 'bg-primary',
												)}
											/>
										)}
									</div>
								)
							})}
						</TabsList>

						{tabs.map((tab) => (
							<TabsContent
								key={tab.id}
								className={cn(
									isHydrating && 'invisible',
									'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300 motion-reduce:data-[state=active]:animate-none',
									stepTransitionDirection === 'forward'
										? 'data-[state=active]:slide-in-from-right-4'
										: 'data-[state=active]:slide-in-from-left-4',
								)}
								value={tab.id}
							>
								<PageTitle
									sticky
									actions={
										<div className='flex items-center gap-2'>
											{creationLocale ? (
												<Badge variant='secondary'>
													{interpolateUILocaleText(pageT.selectedLanguage, {
														language: creationLocale === 'ru' ? t.languages.ru : t.languages.kk,
													})}
												</Badge>
											) : null}
											<Button
												size='sm'
												type='button'
												variant='outline'
												onClick={() => setIsLanguageDialogOpen(true)}
											>
												{pageT.changeLanguage}
											</Button>
										</div>
									}
									className='mb-5'
									description={tab.description}
								>
									{tab.fullTitle} <Badge variant='outline'>{pageT.draft}</Badge>
								</PageTitle>

								{tab.content}

								<div className='flex items-center justify-between gap-4 mt-4'>
									{currentIndex === 0 ? (
										<Button size='lg' type='reset' variant='outline' onClick={onReset}>
											{pageT.reset}
										</Button>
									) : (
										<Button size='lg' type='button' variant='outline' onClick={goBack}>
											<ChevronLeft /> {pageT.back}
										</Button>
									)}

									{currentIndex === tabs.length - 1 ? (
										<Button
											disabled={isSubmitting || isValidating}
											size='lg'
											type='button'
											variant='secondary'
											onClick={handlePreSave}
										>
											{(isSubmitting || isValidating) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
											{isSubmitting ? pageT.saving : isValidating ? pageT.checking : pageT.save}
										</Button>
									) : (
										<Button size='lg' type='button' onClick={goNext}>
											{pageT.next} <ChevronRight />
										</Button>
									)}
								</div>
							</TabsContent>
						))}
					</Tabs>
				</form>
			)}
		</FormProvider>
	)
}

export default withRole(Page, [RoleEnum.TEACHER, RoleEnum.METHODIST])

export interface ITab {
	id: string
	title: string
	fullTitle: string
	description: string
	content: JSX.Element
}
