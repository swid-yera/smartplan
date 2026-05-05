'use client'

import type { FormEvent } from 'react'
import { useMemo } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, Pagination } from '@components'
import { lessonTypeLabels, topicTypeIcons } from '@helpers'
import { services } from '@services'
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { ILesson, LessonTypeEnum } from '@types'
import { Calendar, FileText, Search, Users } from 'lucide-react'

const ALL_FILTER = 'ALL'
const PAGE_SIZE_OPTIONS = [10, 20, 50]
const lessonTypeIcons = {
	PRACTICE: topicTypeIcons.PRACTICAL,
	THEORY: topicTypeIcons.COMBINED,
} as const

const getLessonDescription = (lesson: ILesson): string => {
	const description = [lesson.goals, lesson.tasks, lesson.expected].find((item) => item?.trim())

	return description?.trim() || 'Описание урока будет доступно после генерации.'
}

const formatLessonDate = (value?: string): string => {
	if (!value) {
		return 'Не указана'
	}

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) {
		return 'Не указана'
	}

	return new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	}).format(date)
}

export default function MyLessonPlansPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const { authLoading, user } = useAuthStore()

	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10
	const search = (searchParams.get('q') || '').trim()
	const rawType = searchParams.get('type') || ALL_FILTER
	const rawDiscipline = searchParams.get('discipline') || ALL_FILTER
	const rawGroup = searchParams.get('group') || ALL_FILTER

	const { data, isLoading } = useQuery({
		...services.lesson.getAllOptions({
			currentPage: page,
			pageSize,
			search,
			teacher: user?.keycloakId,
		}),
		enabled: !authLoading && !!user,
	})

	const lessons = data?.data || []
	const disciplineOptions = useMemo(() => {
		const values = Array.from(new Set(lessons.map((lesson) => lesson.discipline_name).filter(Boolean))).sort((a, b) =>
			a.localeCompare(b, 'ru-RU'),
		)

		if (rawDiscipline !== ALL_FILTER && !values.includes(rawDiscipline)) {
			return [rawDiscipline, ...values]
		}

		return values
	}, [lessons, rawDiscipline])
	const groupOptions = useMemo(() => {
		const values = Array.from(new Set(lessons.map((lesson) => lesson.group?.name).filter(Boolean))).sort((a, b) =>
			a.localeCompare(b, 'ru-RU'),
		)

		if (rawGroup !== ALL_FILTER && !values.includes(rawGroup)) {
			return [rawGroup, ...values]
		}

		return values
	}, [lessons, rawGroup])

	const selectedType = Object.keys(lessonTypeLabels).includes(rawType) ? (rawType as LessonTypeEnum) : ALL_FILTER
	const selectedDiscipline = rawDiscipline
	const selectedGroup = rawGroup

	const filteredLessons = useMemo(
		() =>
			lessons.filter((lesson) => {
				if (selectedType !== ALL_FILTER && lesson.type !== selectedType) {
					return false
				}

				if (selectedDiscipline !== ALL_FILTER && lesson.discipline_name !== selectedDiscipline) {
					return false
				}

				if (selectedGroup !== ALL_FILTER && lesson.group?.name !== selectedGroup) {
					return false
				}

				return true
			}),
		[lessons, selectedDiscipline, selectedGroup, selectedType],
	)

	const updateSearchParams = (params: Record<string, string | number | null>) => {
		const nextParams = new URLSearchParams(searchParams.toString())

		for (const [key, value] of Object.entries(params)) {
			if (value === null || value === '') {
				nextParams.delete(key)
				continue
			}

			nextParams.set(key, String(value))
		}

		router.push(`${pathname}?${nextParams.toString()}`)
	}

	const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)
		const q = String(formData.get('q') || '').trim()

		updateSearchParams({ q: q || null, page: 1 })
	}

	const clearFilters = () => {
		updateSearchParams({
			q: null,
			type: null,
			discipline: null,
			group: null,
			page: 1,
		})
	}

	if (authLoading || isLoading || !user) {
		return <Loader type='data' />
	}

	return (
		<section className='mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6'>
			<PageTitle description='Список ваших поурочных планов с быстрым поиском и фильтрами.'>
				Мои поурочные планы
			</PageTitle>

			<Alert>
				<AlertDescription>
					Все поурочные планы генерируются после создания Рабочего учебного плана.{' '}
					<Link className='underline underline-offset-4' href='/rups/my'>
						Перейти к моим РУП
					</Link>
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='text-base'>Фильтрация</CardTitle>
					<CardDescription>Поиск по названию, дисциплине, РУП и группе.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className='grid gap-3 md:grid-cols-2 xl:grid-cols-4' onSubmit={handleSearchSubmit}>
						<div className='relative md:col-span-2'>
							<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
							<Input
								key={search}
								className='pl-9'
								defaultValue={search}
								name='q'
								placeholder='Поиск по теме или описанию'
							/>
						</div>

						<Select
							value={selectedType}
							onValueChange={(value) =>
								updateSearchParams({ type: value === ALL_FILTER ? null : value, page: 1 })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder='Тип занятия' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER}>Все типы</SelectItem>
								{Object.entries(lessonTypeLabels).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={selectedDiscipline}
							onValueChange={(value) =>
								updateSearchParams({ discipline: value === ALL_FILTER ? null : value, page: 1 })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder='Дисциплина' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER}>Все дисциплины</SelectItem>
								{disciplineOptions.map((discipline) => (
									<SelectItem key={discipline} value={discipline}>
										{discipline}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={selectedGroup}
							onValueChange={(value) =>
								updateSearchParams({ group: value === ALL_FILTER ? null : value, page: 1 })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder='Группа' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER}>Все группы</SelectItem>
								{groupOptions.map((group) => (
									<SelectItem key={group} value={group}>
										{group}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className='flex flex-wrap items-center justify-end gap-2 md:col-span-2 xl:col-span-4'>
							<Button type='submit' variant='secondary'>
								<Search data-icon='inline-start' />
								Применить
							</Button>
							<Button type='button' variant='outline' onClick={clearFilters}>
								Сбросить
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{filteredLessons.length > 0 ? (
				<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
					{filteredLessons.map((lesson) => {
						const TypeIcon = lessonTypeIcons[lesson.type]

						return (
							<Card key={lesson.id} className='flex h-full flex-col'>
								<CardHeader className='gap-3'>
									<CardTitle className='line-clamp-2 text-base leading-snug'>
										{lesson.topic_name || 'Без названия'}
									</CardTitle>

									<CardDescription className='line-clamp-3'>{getLessonDescription(lesson)}</CardDescription>
								</CardHeader>

								<CardContent className='mt-auto flex flex-1 flex-col gap-4 text-sm'>
									<div className='flex flex-col gap-3 text-muted-foreground'>
										<div className='flex items-center gap-2'>
											<TypeIcon className='size-4' />
											<span>{lessonTypeLabels[lesson.type]}</span>
										</div>
										<div className='flex flex-col gap-1'>
											<p className='text-xs uppercase tracking-wide'>РУП</p>
											<p className='font-medium text-foreground'>{lesson.rup_name || 'Не указан'}</p>
										</div>
										<div className='flex flex-col gap-1'>
											<p className='text-xs uppercase tracking-wide'>Дисциплина</p>
											<p className='font-medium text-foreground'>{lesson.discipline_name || 'Не указана'}</p>
										</div>
										<div className='flex items-center gap-2'>
											<Users className='size-4' />
											<span>{lesson.group?.name || 'Группа не указана'}</span>
										</div>
										<div className='flex items-center gap-2'>
											<Calendar className='size-4' />
											<span>{formatLessonDate(lesson.event_date)}</span>
										</div>
									</div>

									<Button asChild className='mt-auto w-full' size='sm'>
										<Link href={`/lessons/${lesson.id}`}>
											<FileText data-icon='inline-start' />
											Открыть план
										</Link>
									</Button>
								</CardContent>
							</Card>
						)
					})}
				</div>
			) : (
				<Card className='border-dashed'>
					<CardContent className='py-12 text-center'>
						<p className='text-base font-medium'>Подходящие планы не найдены</p>
						<p className='mt-2 text-sm text-muted-foreground'>
							Измените фильтры или создайте Рабочий учебный план, чтобы сгенерировать новые поурочные планы.
						</p>
					</CardContent>
				</Card>
			)}

			{(data?.meta.pages || 0) > 0 && (
				<Pagination
					page={data?.meta.currentPage || page}
					pageSize={data?.meta.pageSize || pageSize}
					pageSizeOptions={PAGE_SIZE_OPTIONS}
					totalPages={data?.meta.pages || 1}
					onPageChange={(nextPage) => updateSearchParams({ page: nextPage })}
					onPageSizeChange={(nextPageSize) => updateSearchParams({ pageSize: nextPageSize, page: 1 })}
				/>
			)}
		</section>
	)
}
