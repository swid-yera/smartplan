'use client'

import { type FormEvent, type ReactNode, useState } from 'react'

import { notFound, useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle } from '@components'
import { isAuthor, lessonTypeLabels } from '@helpers'
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
	AlertDialogTrigger,
	Button,
	ButtonGroup,
	Calendar,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from '@shadcn'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ILesson, IUpdateLessonRequest } from '@types'
import { LessonResourceTypeEnum, LessonTypeEnum } from '@types'
import { isAxiosError } from 'axios'
import { format } from 'date-fns'
import {
	CalendarDays,
	ChevronDown,
	FileText,
	Grid2X2,
	Link2,
	LinkIcon,
	ListChecks,
	Plus,
	Save,
	SquareMenu,
	Target,
	Trash,
	Trophy,
	X,
} from 'lucide-react'
import { toast } from 'sonner'

type IResourceRow = {
	id?: string
	name: string
	link: string
}

type ILessonFormState = {
	topicName: string
	type: LessonTypeEnum
	eventDate: Date | undefined
	eventTime: string
	goals: string
	tasks: string
	expected: string
	fileUrl: string
	internetResources: IResourceRow[]
	technicalResources: IResourceRow[]
}

export default function LessonEditPage() {
	const params = useParams<{ id: string }>()
	const { authLoading, user } = useAuthStore()

	const { data: lesson, isLoading } = useQuery({
		...services.lesson.getByIdOptions(params.id),
		enabled: !!params.id,
	})

	if (authLoading || isLoading) return <Loader />
	if (!user || !lesson) return notFound()

	const teacherId = lesson.teacher?.keycloakId || lesson.teacher_id || ''
	const canManageLesson = isAuthor(user, teacherId)

	if (!canManageLesson) return notFound()

	return <LessonEditForm lesson={lesson} />
}

function LessonEditForm({ lesson }: { lesson: ILesson }) {
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
			internet_resources: normalizeResources(formData.internetResources, LessonResourceTypeEnum.INTERNET),
			technical_resources: normalizeResources(formData.technicalResources, LessonResourceTypeEnum.TECHNICAL),
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
				<Card>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2'>
							<FileText className='h-4 w-4 text-primary' />
							Основные данные
						</CardTitle>
						<CardDescription>Измените тему, тип и дату урока</CardDescription>
					</CardHeader>
					<CardContent className='grid gap-4 sm:grid-cols-2'>
						<div className='grid gap-2 sm:col-span-2'>
							<Label className='inline-flex items-center gap-2' htmlFor='topic-name'>
								<SquareMenu className='h-4 w-4 text-primary' />
								Тема урока
							</Label>
							<Input
								id='topic-name'
								value={formData.topicName}
								onChange={(e) => setFormData((prev) => ({ ...prev, topicName: e.target.value }))}
							/>
						</div>
						<div className='grid gap-2'>
							<Label className='inline-flex items-center gap-2'>
								<Grid2X2 className='h-4 w-4 text-primary' />
								Тип занятия
							</Label>
							<Select
								value={formData.type}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as LessonTypeEnum }))}
							>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Выберите тип' />
								</SelectTrigger>
								<SelectContent>
									{Object.values(LessonTypeEnum).map((type) => (
										<SelectItem key={type} value={type}>
											{lessonTypeLabels[type]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='grid gap-2'>
							<Label className='inline-flex items-center gap-2' htmlFor='event-date'>
								<CalendarDays className='h-4 w-4 text-primary' />
								Дата и время проведения
							</Label>
							<div className='grid grid-cols-2 gap-2'>
								<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
									<PopoverTrigger asChild>
										<Button className='w-full justify-between font-normal' id='event-date' variant='outline'>
											{formData.eventDate ? format(formData.eventDate, 'dd.MM.yyyy') : 'Выберите дату'}
											<ChevronDown />
										</Button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-auto overflow-hidden p-0'>
										<Calendar
											captionLayout='dropdown'
											defaultMonth={formData.eventDate}
											mode='single'
											selected={formData.eventDate}
											onSelect={(eventDate) => {
												setFormData((prev) => ({ ...prev, eventDate }))
												setIsDatePickerOpen(false)
											}}
										/>
									</PopoverContent>
								</Popover>
								<Input
									aria-describedby='event-time-error'
									aria-invalid={Boolean(eventTimeError)}
									className={cn(
										'w-full',
										eventTimeError && 'border-destructive focus-visible:ring-destructive/30',
									)}
									id='event-time'
									inputMode='numeric'
									maxLength={5}
									placeholder='ЧЧ:мм'
									type='text'
									value={formData.eventTime}
									onBlur={() => {
										const normalizedValue = normalizeTimeInputOnBlur(formData.eventTime)

										setFormData((prev) => ({ ...prev, eventTime: normalizedValue }))
										setEventTimeError(getEventTimeError(normalizedValue))
									}}
									onChange={(e) => {
										setFormData((prev) => ({ ...prev, eventTime: sanitizeTimeInput(e.target.value) }))

										if (eventTimeError) {
											setEventTimeError(null)
										}
									}}
								/>
							</div>
							{eventTimeError && (
								<p className='text-sm text-destructive' id='event-time-error'>
									{eventTimeError}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				<div className='grid gap-6 xl:grid-cols-3'>
					<Card>
						<CardHeader>
							<CardTitle className='inline-flex items-center gap-2'>
								<Target className='h-4 w-4 text-primary' />
								Цели
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								className='min-h-44'
								value={formData.goals}
								onChange={(e) => setFormData((prev) => ({ ...prev, goals: e.target.value }))}
							/>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className='inline-flex items-center gap-2'>
								<ListChecks className='h-4 w-4 text-primary' />
								Задачи
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								className='min-h-44'
								value={formData.tasks}
								onChange={(e) => setFormData((prev) => ({ ...prev, tasks: e.target.value }))}
							/>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className='inline-flex items-center gap-2'>
								<Trophy className='h-4 w-4 text-primary' />
								Ожидаемые результаты
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Textarea
								className='min-h-44'
								value={formData.expected}
								onChange={(e) => setFormData((prev) => ({ ...prev, expected: e.target.value }))}
							/>
						</CardContent>
					</Card>
				</div>

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

function ResourceEditor({
	title,
	description,
	icon,
	items,
	onChange,
	onAdd,
	onRemove,
}: {
	title: string
	description: string
	icon?: ReactNode
	items: IResourceRow[]
	onChange: (index: number, field: 'name' | 'link', value: string) => void
	onAdd: () => void
	onRemove: (index: number) => void
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='inline-flex items-center gap-2'>
					{icon}
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className='flex flex-col gap-4 text-sm'>
				<div className='flex flex-col gap-2'>
					<Label className='inline-flex items-center gap-2'>
						<LinkIcon className='h-4 w-4 text-primary' />
						Ресурсы
					</Label>
					<ol className='flex list-none flex-col gap-2'>
						{items.map((item, index) => {
							const hasLink = Boolean(item.link.trim())

							return (
								<li key={item.id || `${title}-${index}`} className='flex items-start gap-2'>
									<div className='w-4 pt-2 text-xs text-muted-foreground'>{index + 1}.</div>
									<Input
										className='flex-1'
										placeholder='Название ресурса'
										value={item.name}
										onChange={(e) => onChange(index, 'name', e.target.value)}
									/>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												className={cn(hasLink && 'bg-secondary')}
												size='icon'
												type='button'
												variant={hasLink ? 'default' : 'outline'}
											>
												<LinkIcon className='h-4 w-4' />
											</Button>
										</PopoverTrigger>
										<PopoverContent className='w-80'>
											<div className='flex flex-col gap-4'>
												<div className='flex flex-col gap-2'>
													<h4 className='font-medium leading-none'>Добавить ссылку</h4>
													<p className='text-sm text-muted-foreground'>Вставьте URL-адрес ресурса</p>
												</div>
												<Input
													placeholder='https://example.com'
													value={item.link}
													onChange={(e) => onChange(index, 'link', e.target.value)}
												/>
											</div>
										</PopoverContent>
									</Popover>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className='text-destructive hover:bg-destructive/10'
												size='icon'
												type='button'
												variant='outline'
											>
												<Trash className='h-4 w-4' />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Вы уверены?</AlertDialogTitle>
												<AlertDialogDescription>
													Это действие удалит ресурс
													<strong className='ml-1 text-foreground'>{item.name || `№${index + 1}`}</strong>.
													Отменить это действие будет невозможно.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Отмена</AlertDialogCancel>
												<AlertDialogAction
													className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
													onClick={() => onRemove(index)}
												>
													Удалить
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</li>
							)
						})}
					</ol>
				</div>
				<Button size='sm' type='button' variant='outline' onClick={onAdd}>
					<Plus className='mr-2 h-4 w-4' />
					Добавить ресурс
				</Button>
			</CardContent>
		</Card>
	)
}

function createEmptyResource(): IResourceRow {
	return {
		link: '',
		name: '',
	}
}

function mapResourcesForForm(items: ILesson['internet_resources']): IResourceRow[] {
	if (!items.length) return [createEmptyResource()]

	return items.map((item) => ({
		id: item.id,
		link: item.link || '',
		name: item.name || '',
	}))
}

function normalizeResources(items: IResourceRow[], type: LessonResourceTypeEnum) {
	return items
		.map((item) => ({
			id: item.id,
			link: item.link.trim(),
			name: item.name.trim(),
			type,
		}))
		.filter((item) => item.name)
}

function toEventDateFormState(value?: string | null): Pick<ILessonFormState, 'eventDate' | 'eventTime'> {
	if (!value) {
		return {
			eventDate: undefined,
			eventTime: '',
		}
	}

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) {
		return {
			eventDate: undefined,
			eventTime: '',
		}
	}

	const timezoneOffsetMs = date.getTimezoneOffset() * 60_000
	const localDate = new Date(date.getTime() - timezoneOffsetMs)
	const [localDateValue, localTimeValue] = localDate.toISOString().slice(0, 16).split('T')

	return {
		eventDate: localDateValue ? new Date(`${localDateValue}T00:00:00`) : undefined,
		eventTime: localTimeValue || '',
	}
}

function toIsoFromDateAndTimeInput(eventDate: Date | undefined, eventTime: string, fallback: string): string {
	if (!eventDate || !eventTime) {
		return fallback
	}

	const [hours, minutes] = eventTime.split(':')
	const date = new Date(eventDate)
	const parsedHours = Number.parseInt(hours, 10)
	const parsedMinutes = Number.parseInt(minutes, 10)

	date.setHours(Number.isFinite(parsedHours) ? parsedHours : 0)
	date.setMinutes(Number.isFinite(parsedMinutes) ? parsedMinutes : 0)
	date.setSeconds(0, 0)

	if (Number.isNaN(date.getTime())) {
		return fallback
	}

	return date.toISOString()
}

function isValid24HourTime(value: string): boolean {
	return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

function getEventTimeError(value: string): string | null {
	if (!value) {
		return 'Укажите время проведения'
	}

	if (!isValid24HourTime(value)) {
		return 'Укажите время в формате 24 часа (HH:mm)'
	}

	return null
}

function sanitizeTimeInput(value: string): string {
	const cleanedValue = value.replaceAll(/[^\d:]/g, '')
	const [left = '', ...rightParts] = cleanedValue.split(':')
	const hasColon = cleanedValue.includes(':')

	if (hasColon) {
		return `${left.slice(0, 2)}:${rightParts.join('').slice(0, 2)}`
	}

	return left.slice(0, 4)
}

function normalizeTimeInputOnBlur(value: string): string {
	const sanitized = sanitizeTimeInput(value)

	if (!sanitized) {
		return ''
	}

	const hasColon = sanitized.includes(':')
	const [hourPart = '', ...minuteParts] = sanitized.split(':')
	const digitsOnly = sanitized.replaceAll(/\D/g, '')

	let hour = hourPart
	let minute = minuteParts.join('')

	if (!hasColon) {
		if (digitsOnly.length <= 2) {
			return digitsOnly
		}

		hour = digitsOnly.slice(0, 2)
		minute = digitsOnly.slice(2, 4)
	}

	if (!hour) {
		return ''
	}

	if (!minute) {
		return sanitized
	}

	return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

function extractSaveErrorMessage(error: unknown): string {
	if (isAxiosError(error)) {
		const responseData = error.response?.data

		if (typeof responseData === 'string' && responseData.trim()) {
			return responseData
		}

		if (typeof responseData === 'object' && responseData !== null) {
			const message = responseData.message
			const backendError = responseData.error

			if (typeof message === 'string' && message.trim()) {
				return message
			}

			if (Array.isArray(message) && message.length) {
				return message.join(', ')
			}

			if (typeof backendError === 'string' && backendError.trim()) {
				return backendError
			}
		}

		return error.message || 'Ошибка при сохранении урока'
	}

	if (error instanceof Error) {
		return error.message
	}

	return 'Ошибка при сохранении урока'
}

function serializeSaveError(error: unknown) {
	if (isAxiosError(error)) {
		return {
			message: error.message,
			method: error.config?.method,
			response: error.response?.data,
			status: error.response?.status,
			statusText: error.response?.statusText,
			url: error.config?.url,
		}
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
			stack: error.stack,
		}
	}

	return {
		error,
	}
}
