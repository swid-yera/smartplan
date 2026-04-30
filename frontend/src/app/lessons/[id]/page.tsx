'use client'

import { type ReactNode, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle } from '@components'
import { hasRole, normalizeLessonType, normalizeTopicType } from '@helpers'
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
	ButtonGroup,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { IGenerateLessonRequest, ILesson, ILessonResource } from '@types'
import { RoleEnum, TopicTypeEnum } from '@types'
import {
	Calendar,
	Edit,
	FileDown,
	FileText,
	Folder,
	GraduationCap,
	Grid2X2,
	Link2,
	ListChecks,
	Phone,
	RefreshCw,
	Target,
	Trash,
	Trophy,
	UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

type ILessonContext = ILesson & {
	rup_id?: string
	rupId?: string
	discipline_id?: string
	disciplineId?: string
	topic_id?: string
	topicId?: string
	topic_type?: TopicTypeEnum
	topicType?: TopicTypeEnum
	theory_hours?: number
	theoryHours?: number
	practice_hours?: number
	practiceHours?: number
	individual_hours?: number
	individualHours?: number
	srsp_hours?: number
	srspHours?: number
	srs_hours?: number
	srsHours?: number
}

type IRegenerateFormData = {
	name: string
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours: number
	srsHours: number
	type: TopicTypeEnum
}

export default function LessonPage() {
	const { push, replace } = useRouter()
	const params = useParams<{ id: string }>()
	const { authLoading, user } = useAuthStore()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)
	const [regenerateFormData, setRegenerateFormData] = useState<IRegenerateFormData>({
		name: '',
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
		srspHours: 0,
		srsHours: 0,
		type: TopicTypeEnum.SNZ,
	})

	const { data: lesson, isLoading } = useQuery({
		...services.lesson.getByIdOptions(params.id),
		enabled: !!params.id,
	})
	const deleteLessonMutation = useMutation(services.lesson.deleteMutationOptions())
	const regenerateLessonMutation = useMutation(services.lesson.generateLessonOptions())

	if (authLoading || isLoading) return <Loader />
	if (!user || !lesson) return notFound()

	const lessonContext = lesson as ILessonContext
	const currentRupId = lessonContext.rup_id || lessonContext.rupId || ''
	const currentDisciplineId = lessonContext.discipline_id || lessonContext.disciplineId || ''
	const currentTopicId = lessonContext.topic_id || lessonContext.topicId || ''
	const inferredTopicType = lessonContext.topic_type || lessonContext.topicType
	const fallbackTopicType = lesson.type === 'PRACTICE' ? TopicTypeEnum.PRACTICAL : TopicTypeEnum.SNZ
	const canRegenerate = Boolean(currentRupId && currentDisciplineId && currentTopicId)

	const resolveNonNegative = (...values: Array<number | undefined>) => {
		for (const value of values) {
			if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
		}

		return 0
	}

	const getNonNegativeNumber = (value: string) => Math.max(0, Number(value) || 0)

	const teacherName =
		[lesson.teacher?.lastName, lesson.teacher?.firstName].filter(Boolean).join(' ') ||
		lesson.teacher?.username ||
		lesson.teacher_id ||
		'Пусто'
	const teacherId = lesson.teacher?.keycloakId || lesson.teacher_id || ''
	const isAdmin = hasRole(user.role, RoleEnum.ADMIN)
	const isTeacherOwner = hasRole(user.role, RoleEnum.TEACHER, false) && user.keycloakId === teacherId
	const canManageLesson = isAdmin || isTeacherOwner
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

		const payload: IGenerateLessonRequest = {
			rupId: currentRupId,
			disciplineId: currentDisciplineId,
			topicId: currentTopicId,
			updatedTopic: {
				name: regenerateFormData.name,
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
				actions={
					<ButtonGroup>
						{canManageLesson && (
							<Button asChild size='sm' variant='outline'>
								<Link href={`/lessons/${lesson.id}/edit`}>
									<Edit className='mr-2 h-4 w-4' />
									Редактировать
								</Link>
							</Button>
						)}
						{canManageLesson && (
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
						{canManageLesson && (
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
				}
				backHref='/lessons/my'
				description='Детальная информация по уроку'
			>
				{lesson.topic_name}
			</PageTitle>

			<div className='grid gap-6 xl:grid-cols-3'>
				<div className='space-y-6 xl:col-span-2'>
					<Card className={cardClassName}>
						<CardHeader>
							<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
								<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<FileText className='h-4 w-4' />
								</span>
								Основная информация
							</CardTitle>
							<CardDescription>Ключевые сведения о занятии, теме и формате</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid gap-x-8 gap-y-5'>
								<InfoRow icon={<Folder className='h-4 w-4' />} label='РУП' value={lesson.rup_name} />
								<InfoRow
									icon={<Grid2X2 className='h-4 w-4' />}
									label='Дисциплина'
									value={lesson.discipline_name}
								/>
								<InfoRow icon={<FileText className='h-4 w-4' />} label='Тема урока' value={lesson.topic_name} />
								<Row label='Тип занятия' value={normalizeLessonType(lesson.type)} />
								<Row label='Дата проведения' value={formatDate(lesson.event_date)} />
							</div>
						</CardContent>
					</Card>

					<Card className={cardClassName}>
						<CardHeader>
							<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
								<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<GraduationCap className='h-4 w-4' />
								</span>
								Группа
							</CardTitle>
						</CardHeader>
						<CardContent className='grid gap-5 sm:grid-cols-2'>
							<InfoRow icon={<GraduationCap className='h-4 w-4' />} label='Название' value={groupName} />
							<Row label='Квалификация' value={lesson.group?.qualification || 'Пусто'} />
							<Row label='Специальность' value={lesson.group?.specialty || 'Пусто'} />
						</CardContent>
					</Card>
				</div>

				<Card className={cardClassName}>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
							<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<UserRound className='h-4 w-4' />
							</span>
							Преподаватель
						</CardTitle>
						<CardDescription>Ответственный за проведение занятия</CardDescription>
					</CardHeader>
					<CardContent className='grid gap-5'>
						<InfoRow icon={<UserRound className='h-4 w-4' />} label='ФИО' value={teacherName} />
						<InfoRow
							icon={<Phone className='h-4 w-4' />}
							label='Телефон'
							value={lesson.teacher?.phone || 'Пусто'}
						/>
						<InfoRow
							icon={<Calendar className='h-4 w-4' />}
							label='Логин'
							value={lesson.teacher?.username || 'Пусто'}
						/>
						<Row label='Создано' value={formatDate(lesson.created_at)} />
						<Row label='Обновлено' value={formatDate(lesson.updated_at)} />
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 xl:grid-cols-2'>
				<Card className={cardClassName}>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
							<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<Link2 className='h-4 w-4' />
							</span>
							Интернет-ресурсы
						</CardTitle>
						<CardDescription>Ссылки и онлайн-материалы к занятию</CardDescription>
					</CardHeader>
					<CardContent>
						<ResourceList items={lesson.internet_resources} title='Интернет-ресурсы' />
					</CardContent>
				</Card>

				<Card className={cardClassName}>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
							<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<Grid2X2 className='h-4 w-4' />
							</span>
							Технические ресурсы
						</CardTitle>
						<CardDescription>Оборудование и локальные материалы</CardDescription>
					</CardHeader>
					<CardContent>
						<ResourceList items={lesson.technical_resources} title='Технические ресурсы' />
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 xl:grid-cols-3'>
				<Card className={`${cardClassName} lg:col-span-1`}>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
							<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<Target className='h-4 w-4' />
							</span>
							Цели
						</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
						{lesson.goals || 'Пусто'}
					</CardContent>
				</Card>
				<Card className={`${cardClassName} lg:col-span-1`}>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
							<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<ListChecks className='h-4 w-4' />
							</span>
							Задачи
						</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
						{lesson.tasks || 'Пусто'}
					</CardContent>
				</Card>
				<Card className={`${cardClassName} lg:col-span-1`}>
					<CardHeader>
						<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
							<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<Trophy className='h-4 w-4' />
							</span>
							Ожидаемые результаты
						</CardTitle>
					</CardHeader>
					<CardContent className='min-h-44 whitespace-pre-wrap text-sm leading-7 text-foreground/90'>
						{lesson.expected || 'Пусто'}
					</CardContent>
				</Card>
			</div>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить урок?</AlertDialogTitle>
						<AlertDialogDescription>
							Это действие нельзя отменить. Урок будет удален без возможности восстановления.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Отмена</AlertDialogCancel>
						<AlertDialogAction variant='destructive' onClick={handleDeleteLesson}>
							Удалить
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Данные темы</DialogTitle>
						<DialogDescription>Измените данные и запустите перегенерацию урока.</DialogDescription>
					</DialogHeader>

					<div className='grid gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='lesson-topic-name'>Название</Label>
							<Input
								id='lesson-topic-name'
								value={regenerateFormData.name}
								onChange={(e) => setRegenerateFormData((prev) => ({ ...prev, name: e.target.value }))}
							/>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='lesson-topic-theory'>Теория</Label>
								<Input
									id='lesson-topic-theory'
									min={0}
									type='number'
									value={regenerateFormData.theoryHours}
									onChange={(e) =>
										setRegenerateFormData((prev) => ({
											...prev,
											theoryHours: getNonNegativeNumber(e.target.value),
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='lesson-topic-practice'>Практика</Label>
								<Input
									id='lesson-topic-practice'
									min={0}
									type='number'
									value={regenerateFormData.practiceHours}
									onChange={(e) =>
										setRegenerateFormData((prev) => ({
											...prev,
											practiceHours: getNonNegativeNumber(e.target.value),
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='lesson-topic-individual'>Индивидуальная</Label>
								<Input
									id='lesson-topic-individual'
									min={0}
									type='number'
									value={regenerateFormData.individualHours}
									onChange={(e) =>
										setRegenerateFormData((prev) => ({
											...prev,
											individualHours: getNonNegativeNumber(e.target.value),
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='lesson-topic-srsp'>СРСП</Label>
								<Input
									id='lesson-topic-srsp'
									min={0}
									type='number'
									value={regenerateFormData.srspHours}
									onChange={(e) =>
										setRegenerateFormData((prev) => ({
											...prev,
											srspHours: getNonNegativeNumber(e.target.value),
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='lesson-topic-srs'>СРС</Label>
								<Input
									id='lesson-topic-srs'
									min={0}
									type='number'
									value={regenerateFormData.srsHours}
									onChange={(e) =>
										setRegenerateFormData((prev) => ({
											...prev,
											srsHours: getNonNegativeNumber(e.target.value),
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Тип</Label>
								<Select
									value={regenerateFormData.type}
									onValueChange={(value) =>
										setRegenerateFormData((prev) => ({ ...prev, type: value as TopicTypeEnum }))
									}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Выберите тип' />
									</SelectTrigger>
									<SelectContent>
										{Object.values(TopicTypeEnum).map((topicType) => (
											<SelectItem key={topicType} value={topicType}>
												{normalizeTopicType(topicType)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => setIsRegenerateDialogOpen(false)}>
							Отмена
						</Button>
						<Button disabled={!canRegenerate || regenerateLessonMutation.isPending} onClick={handleRegenerate}>
							Перегенерировать
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	)
}

function formatDate(value?: string | null) {
	if (!value) return 'Пусто'

	const parsed = new Date(value)

	if (Number.isNaN(parsed.getTime())) return value

	return new Intl.DateTimeFormat('ru-KZ', {
		dateStyle: 'long',
		timeStyle: 'short',
	}).format(parsed)
}

function Row({ label, value }: { label: string; value: string | number }) {
	return (
		<div className='grid gap-1'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='text-sm font-medium leading-snug text-foreground'>{value || 'Пусто'}</p>
		</div>
	)
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
	return (
		<div className='grid gap-1'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>{label}</p>
			<p className='inline-flex items-start gap-2 text-sm font-medium leading-snug text-foreground'>
				<span className='mt-0.5 text-primary'>{icon}</span>
				<span>{value || 'Пусто'}</span>
			</p>
		</div>
	)
}

function ResourceList({ title, items }: { title: string; items: ILessonResource[] }) {
	return (
		<div className='space-y-2'>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{title}</p>
			<div className='max-h-56 overflow-auto rounded-xl border border-border/70 bg-muted/20 p-2'>
				{items.length ? (
					<ul className='divide-y divide-border/70'>
						{items.map((item, index) => (
							<li key={item.id} className='flex items-start gap-2 px-1 py-3 first:pt-1 last:pb-1'>
								<Badge className='mt-0.5 min-w-6' variant='secondary'>
									{index + 1}
								</Badge>
								<div className='space-y-1 text-sm'>
									<p className='font-medium'>{item.name || 'Без названия'}</p>
									{item.link ? (
										<Link
											className='inline-flex items-center gap-1 text-primary/90 transition-colors duration-150 hover:text-primary hover:underline'
											href={item.link}
											rel='noopener noreferrer'
											target='_blank'
										>
											<Link2 className='h-3.5 w-3.5 shrink-0' />
											{item.link}
										</Link>
									) : (
										<p className='text-xs text-muted-foreground'>Ссылка не указана</p>
									)}
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className='p-2 text-sm text-muted-foreground'>Пусто</p>
				)}
			</div>
		</div>
	)
}
