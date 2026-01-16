'use client'

import { type JSX, type KeyboardEvent, useEffect, useState } from 'react'

import type { NextPage } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@lib'
import { services } from '@services'
import { useMutation } from '@tanstack/react-query'
import { type ICreateRupRequest, RupTypeEnum, StudyFormEnum } from '@types'
import { Badge, Button, Heading, Tabs, TabsContent, TabsList, TabsTrigger } from '@ui'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { type RUPFormData, formSchema } from '../form-schema'
import { Step1 } from './step1'
import { Step2 } from './step2'
import { Step3 } from './step3'
import { Step4 } from './step4'

const LOCAL_STORAGE_KEY = 'rup-create-form-data'
const HIGHEST_STEP_STORAGE_KEY = 'rup-create-highest-step'

const defaultValues: RUPFormData = {
	name: '',
	code: '',
	type: RupTypeEnum.THEORY,
	studyForm: StudyFormEnum.FULL_TIME,
	basis: '',
	competencies: '',
	summary: '',
	course: 0,
	goals: '',
	prerequisites: '',
	postrequisites: '',
	studyYear: '',
	groupId: '',
	contacts: [],
	internetResources: [],
	technicalResources: [],
	disciplines: [],
}

const Page: NextPage = () => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [currentStep, setCurrentStep] = useState(searchParams.get('step') || '1')
	const [highestStep, setHighestStep] = useState(Number(currentStep))
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isHydrating, setIsHydrating] = useState(true)

	// queries
	const createMutation = useMutation(services.rup.createOptions())

	const methods = useForm<RUPFormData>({
		resolver: zodResolver(formSchema),
		mode: 'onChange',
		shouldUnregister: false,
		defaultValues,
	})

	// This effect synchronizes the component's state with the URL's search param.
	useEffect(() => {
		const stepFromUrl = searchParams.get('step') || '1'

		if (stepFromUrl !== currentStep) {
			setCurrentStep(stepFromUrl)
		}

		if (Number(stepFromUrl) > highestStep) {
			setHighestStep(Number(stepFromUrl))
		}
	}, [searchParams, currentStep, highestStep])

	// This effect hydrates the form with data from localStorage on the client-side.
	// It runs only once after the initial render to prevent hydration errors.
	useEffect(() => {
		const savedData = window.localStorage.getItem(LOCAL_STORAGE_KEY)

		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData)

				// Use reset to update the form with the saved data.
				// We merge with defaultValues to ensure the form shape is always correct.
				methods.reset({ ...defaultValues, ...parsedData })
			} catch (e) {
				console.error('Failed to parse or load form data from localStorage', e)
				window.localStorage.removeItem(LOCAL_STORAGE_KEY)
			}
		}

		const savedHighestStep = window.localStorage.getItem(HIGHEST_STEP_STORAGE_KEY)

		if (savedHighestStep) {
			setHighestStep(Number(savedHighestStep))
		}
		setIsHydrating(false)
		// No matter what, we stop hydrating after the first check.
	}, [methods]) // This effect runs only once on mount.

	// This effect subscribes to form changes and saves them to localStorage.
	useEffect(() => {
		// Prevent saving to localStorage before hydration or after submission.
		if (isHydrating) return

		const subscription = methods.watch((value) => {
			try {
				// To avoid saving incomplete default data on first load, we can check for a title.
				// This is a simple way to ensure the user has interacted with the form.
				if (value.name) {
					window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value))
				}
			} catch (e) {
				console.error('Failed to save form data to localStorage', e)
			}
		})

		return () => subscription.unsubscribe()
	}, [methods, isHydrating])

	// This effect saves the highest step to localStorage.
	useEffect(() => {
		if (!isHydrating) {
			window.localStorage.setItem(HIGHEST_STEP_STORAGE_KEY, String(highestStep))
		}
	}, [highestStep, isHydrating])

	const currentIndex = tabs.findIndex((t) => t.id === currentStep)

	const handleStepChange = (newStep: string) => {
		router.push(`${pathname}?step=${newStep}`, { scroll: false })
	}

	const goNext = async () => {
		const fields = stepFields[currentStep as keyof typeof stepFields]
		const isValid = await methods.trigger(fields as (keyof RUPFormData)[], { shouldFocus: true })

		if (!isValid) {
			return
		}

		if (currentIndex < tabs.length - 1) {
			handleStepChange(tabs[currentIndex + 1].id)
		}
	}

	const goBack = () => {
		if (currentIndex > 0) handleStepChange(tabs[currentIndex - 1].id)
	}

	const onSubmit = async (newData: RUPFormData) => {
		setIsSubmitting(true)

		// mapped disciplines
		const mappedDisciplines = newData.disciplines.map((discipline) => ({
			...discipline,
			topics: discipline.topics.map((topic) => ({
				...topic,
				// Заменяем undefined на 0 для всех числовых полей
				individualHours: topic.individualHours ?? 0,
				srspHours: topic.srspHours ?? 0,
				srsHours: topic.srsHours ?? 0,
			})),
		}))

		// mapped data
		const mappedData: ICreateRupRequest = {
			...newData,
			groups: [newData.groupId],
			explorationNote: {
				basis: newData.basis ?? '',
				goals: newData.goals ?? '',
				competencies: newData.competencies ?? '',
				summary: '',

				prerequisites: newData.prerequisites ?? '',
				postrequisites: newData.postrequisites ?? '',

				internetResources: newData.internetResources,
				technicalResources: newData.technicalResources,
			},
			disciplines: mappedDisciplines,
		}

		const toastId = `rup-create`

		toast.loading(`Создание ${mappedData.code}...`, { id: toastId })

		setIsSubmitting(true)
		createMutation.mutate(
			{ newRup: mappedData },
			{
				onSuccess: (createdRup) => {
					setIsSubmitting(false)
					window.localStorage.removeItem(LOCAL_STORAGE_KEY)
					window.localStorage.removeItem(HIGHEST_STEP_STORAGE_KEY)

					toast.success(`${createdRup.code} успешно создан`, { id: toastId })

					router.push(`/rups/${createdRup.id}`)
				},
				onError: (err) => {
					setIsSubmitting(false)

					toast.error(`Произошла ошибка при обновлений ${mappedData.code}`, {
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

	return (
		<FormProvider {...methods}>
			{isHydrating && (
				<div className='absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
					<div className='flex items-center gap-2 text-muted-foreground'>
						<Loader2 className='h-6 w-6 animate-spin' />
						<p className='text-lg'>Загрузка данных...</p>
					</div>
				</div>
			)}

			<form onKeyDown={handleKeyDown} onSubmit={methods.handleSubmit(onSubmit)}>
				<Tabs className='w-full mx-auto px-4 py-6 space-y-4' value={currentStep} onValueChange={handleStepChange}>
					<TabsList className='flex w-full justify-between bg-background border-0 p-0 rounded-none my-6'>
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
											setCurrentStep(step.id)
										}}
									>
										{/* Circle */}
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

										{/* Title */}
										<div
											className={cn(
												'text-center text-sm font-medium transition-colors',
												isActive || isCompleted ? 'text-primary' : 'text-accent-foreground',
											)}
										>
											{step.title}
										</div>
									</TabsTrigger>

									{/* Connector line */}
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
						<TabsContent key={tab.id} className={cn(isHydrating && 'invisible')} value={tab.id}>
							{/* heading */}
							<div className='mb-4'>
								<Heading align='left' size='h2'>
									{tab.fullTitle} <Badge variant='outline'>Черновик</Badge>
								</Heading>
								<p className='text-muted-foreground'>{tab.description}</p>
							</div>

							{/* content */}
							{tab.content}

							<div className='flex justify-between items-center gap-4 mt-4'>
								<Button
									disabled={currentIndex === 0}
									size='lg'
									type='button'
									variant='outline'
									onClick={goBack}
								>
									<ChevronLeft /> Назад
								</Button>

								{currentIndex === tabs.length - 1 ? (
									<Button disabled={isSubmitting} size='lg' type='submit' variant='secondary'>
										{isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
										{isSubmitting ? 'Сохранение...' : 'Завершить'}
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
		</FormProvider>
	)
}

export default Page

// steps
export interface ITab {
	id: string
	title: string
	fullTitle: string
	description: string
	content: JSX.Element
}

const stepFields = {
	'1': [
		'title',
		'type',
		'studyForm',
		'explorationNote',
		'goals',
		'prerequisites',
		'postrequisites',
		'year',
		'groupId',
	],
	'2': ['contacts', 'internetResources', 'technicalResources'],
	'3': ['disciplines'],
	'4': ['disciplines'], // Step 4 modifies the disciplines array, so we validate it again.
}

const tabs: ITab[] = [
	{
		id: '1',
		title: 'Основные данные',
		fullTitle: 'Создание нового модуля рабочего учебного плана',
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
		description: 'Добавьте дисциплины и распределите кредиты по семестрам',
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
