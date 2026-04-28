'use client'

import { type JSX, type KeyboardEvent, useEffect, useState } from 'react'

import type { NextPage } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle } from '@components'
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
import { useMutation } from '@tanstack/react-query'
import { type ICreateRupRequest, RupTypeEnum, StudyFormEnum } from '@types'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { type RUPFormData, rupFormSchema } from '../rup-schema'
import { Step1 } from './step1'
import { Step2 } from './step2'
import { Step3 } from './step3'
import { Step4 } from './step4'

const LOCAL_STORAGE_KEY = 'rup-create-form-data'
const HIGHEST_STEP_STORAGE_KEY = 'rup-create-highest-step'

const defaultValues: RUPFormData = {
	name: '',
	type: RupTypeEnum.THEORY,
	studyForm: StudyFormEnum.FULL_TIME,
	studyYear: '',

	basis: '',
	goals: '',
	competencies: '',
	course: 0,

	prerequisites: '',
	postrequisites: '',

	internetResources: [],
	technicalResources: [],

	groupId: '',
	contacts: [],
	disciplines: [],
}

const Page: NextPage = () => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const [currentStep, setCurrentStep] = useState(searchParams.get('step') || '1')
	const [highestStep, setHighestStep] = useState(Number(currentStep))
	const [stepTransitionDirection, setStepTransitionDirection] = useState<'forward' | 'backward'>('forward')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isHydrating, setIsHydrating] = useState(true)

	const [isValidating, setIsValidating] = useState(false)
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)

	const createMutation = useMutation(services.rup.createOptions())

	const methods = useForm<RUPFormData>({
		resolver: zodResolver(rupFormSchema),
		mode: 'onChange',
		shouldUnregister: false,
		defaultValues,
	})

	useEffect(() => {
		const stepFromUrl = searchParams.get('step') || '1'

		if (stepFromUrl !== currentStep) setCurrentStep(stepFromUrl)
		if (Number(stepFromUrl) > highestStep) setHighestStep(Number(stepFromUrl))
	}, [searchParams, currentStep, highestStep])

	useEffect(() => {
		const savedData = window.localStorage.getItem(LOCAL_STORAGE_KEY)

		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData)

				methods.reset({ ...defaultValues, ...parsedData })
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
				if (value.name) window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value))
			} catch (e) {
				console.error('Failed to save form data', e)
			}
		})

		return () => subscription.unsubscribe()
	}, [methods, isHydrating])

	useEffect(() => {
		if (!isHydrating) window.localStorage.setItem(HIGHEST_STEP_STORAGE_KEY, String(highestStep))
	}, [highestStep, isHydrating])

	const currentIndex = tabs.findIndex((t) => t.id === currentStep)

	const getStepTransitionDirection = (fromStep: string, toStep: string) =>
		Number(toStep) >= Number(fromStep) ? 'forward' : 'backward'

	const handleStepChange = (newStep: string) => {
		setStepTransitionDirection(getStepTransitionDirection(currentStep, newStep))
		router.push(`${pathname}?step=${newStep}`, { scroll: false })
	}

	const onReset = () => {
		window.localStorage.removeItem('rup-create-form-data')
		window.localStorage.removeItem('rup-create-highest-step')
		methods.reset(defaultValues)
	}

	const goNext = async () => {
		if (currentIndex < tabs.length - 1) {
			handleStepChange(tabs[currentIndex + 1].id)
		}
	}

	const goBack = () => {
		if (currentIndex > 0) handleStepChange(tabs[currentIndex - 1].id)
	}

	const handlePreSave = async () => {
		setIsValidating(true)

		setTimeout(async () => {
			const isValid = await methods.trigger(undefined, { shouldFocus: true })

			setIsValidating(false)

			if (isValid) {
				setIsConfirmOpen(true)
			} else {
				toast.error('Пожалуйста, исправьте ошибки в форме перед сохранением')
			}
		}, 0)
	}

	const onSubmit = async (newData: RUPFormData) => {
		// TODO: validate data

		setIsConfirmOpen(false)
		setIsSubmitting(true)

		const mappedDisciplines = newData.disciplines.map((discipline) => ({
			...discipline,
			name: (discipline.name ?? '').trim(),
			topics: discipline.topics.map((topic) => ({
				...topic,
				name: (topic.name ?? '').trim(),
				individualHours: topic.individualHours ?? 0,
				srspHours: topic.srspHours ?? 0,
				srsHours: topic.srsHours ?? 0,
			})),
		}))

		const mappedExplorationNote = {
			basis: (newData.basis ?? '').trim(),
			goals: (newData.goals ?? '').trim(),
			competencies: (newData.competencies ?? '').trim(),
			summary: '',
			prerequisites: (newData.prerequisites ?? '').trim(),
			postrequisites: (newData.postrequisites ?? '').trim(),
			internetResources: newData.internetResources,
			technicalResources: newData.technicalResources,
		}

		const mappedData: ICreateRupRequest = {
			...newData,
			name: (newData.name ?? '').trim(),
			groups: [newData.groupId],
			disciplines: mappedDisciplines,
			explorationNote: mappedExplorationNote,
		}

		const toastId = `rup-create`

		toast.loading(`Создание ${mappedData.name}...`, { id: toastId })

		createMutation.mutate(
			{ newRup: mappedData },
			{
				onSuccess: (createdRup) => {
					setIsSubmitting(false)
					window.localStorage.removeItem('rup-create-form-data')
					window.localStorage.removeItem('rup-create-highest-step')
					toast.success(`${createdRup.name} успешно создан`, { id: toastId })
					router.push(`/rups/${createdRup.id}`)
				},
				onError: (err) => {
					setIsSubmitting(false)
					toast.error(`Ошибка: ${err.message}`, { id: toastId })
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
			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent className='duration-200 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'>
					<AlertDialogHeader>
						<AlertDialogTitle>Вы точно хотите сохранить?</AlertDialogTitle>
						<AlertDialogDescription>
							После сохранения редактирование с помощью ИИ будет недоступно. Убедитесь, что все данные заполнены
							корректно.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
						<AlertDialogAction disabled={isSubmitting} onClick={(e) => methods.handleSubmit(onSubmit)(e)}>
							{isSubmitting ? 'Сохранение...' : 'Сохранить'}
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
											onClick={(e) => {
												e.preventDefault()
												setStepTransitionDirection(getStepTransitionDirection(currentStep, step.id))
												setCurrentStep(step.id)
											}}
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
										? 'data-[state=active]:slide-in-from-right-2'
										: 'data-[state=active]:slide-in-from-left-2',
								)}
								value={tab.id}
							>
								<PageTitle sticky className='mb-5' description={tab.description}>
									{tab.fullTitle} <Badge variant='outline'>Черновик</Badge>
								</PageTitle>

								{tab.content}

								<div className='flex justify-between items-center gap-4 mt-4'>
									{currentIndex === 0 ? (
										<Button size='lg' type='reset' variant='outline' onClick={onReset}>
											Сбросить
										</Button>
									) : (
										<Button size='lg' type='button' variant='outline' onClick={goBack}>
											<ChevronLeft /> Назад
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
											{isSubmitting ? 'Сохранение...' : isValidating ? 'Проверка...' : 'Сохранить'}
										</Button>
									) : (
										<Button size='lg' type='button' onClick={goNext}>
											Далее <ChevronRight />
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

export default Page

export interface ITab {
	id: string
	title: string
	fullTitle: string
	description: string
	content: JSX.Element
}

const tabs: ITab[] = [
	{
		id: '1',
		title: 'Основные данные',
		fullTitle: 'Создание нового модуля рабочей учебной программы',
		description: 'Базовые данные, пояснительная записка, цели и задачи',
		content: <Step1 />,
	},
	{
		id: '2',
		title: 'Метаданные',
		fullTitle: 'Метаданные, материалы и ресурсы',
		description: 'Метаданные, технические материалы и учебно методические ресурсы',
		content: <Step2 />,
	},
	{
		id: '3',
		title: 'Распределение часов',
		fullTitle: 'Распределение часов по семестру',
		description: 'Добавьте дисциплины и распределите часы по семестрам',
		content: <Step3 />,
	},
	{
		id: '4',
		title: 'Содержание',
		fullTitle: 'Содержание учебной рабочей программы',
		description: 'Добавьте темы занятий для каждой дисциплины',
		content: <Step4 />,
	},
]
