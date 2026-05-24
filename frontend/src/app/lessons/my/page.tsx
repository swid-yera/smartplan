'use client'

import type { FormEvent } from 'react'
import { useMemo } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, Pagination } from '@components'
import { getLessonTypeLabels, getUILocaleSection, topicTypeIcons } from '@helpers'
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
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { ILesson, LessonTypeEnum } from '@types'
import { Calendar, FileText, Search, Users } from 'lucide-react'
import localeDictionary from './locale.json'

const ALL_FILTER = 'ALL'
const PAGE_SIZE_OPTIONS = [10, 20, 50]
const lessonTypeIcons = {
	PRACTICE: topicTypeIcons.PRACTICAL,
	THEORY: topicTypeIcons.COMBINED,
} as const

const getLessonDescription = (lesson: ILesson, fallback: string): string => {
	const description = [lesson.goals, lesson.tasks, lesson.expected].find((item) => item?.trim())

	return description?.trim() || fallback
}

const formatLessonDate = (value: string | undefined, locale: 'ru' | 'kk', emptyText: string): string => {
	if (!value) {
		return emptyText
	}

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) {
		return emptyText
	}

	return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	}).format(date)
}

export default function MyLessonPlansPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const lessonTypeLabels = getLessonTypeLabels(locale)
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
	const selectedType = Object.keys(lessonTypeLabels).includes(rawType) ? (rawType as LessonTypeEnum) : ALL_FILTER
	const selectedDiscipline = rawDiscipline
	const selectedGroup = rawGroup

	const { data, isLoading } = useQuery({
		...services.lesson.getAllOptions({
			currentPage: page,
			pageSize,
			search: search || undefined,
			teacher: user?.keycloakId,
			type: selectedType === ALL_FILTER ? undefined : selectedType,
			discipline: selectedDiscipline === ALL_FILTER ? undefined : selectedDiscipline,
			group: selectedGroup === ALL_FILTER ? undefined : selectedGroup,
		}),
		enabled: !authLoading && !!user,
	})

	const lessons = data?.data || []
	const localeCode = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const disciplineOptions = useMemo(() => {
		const values = Array.from(new Set(lessons.map((lesson) => lesson.discipline_name).filter(Boolean))).sort((a, b) =>
			a.localeCompare(b, localeCode),
		)

		if (rawDiscipline !== ALL_FILTER && !values.includes(rawDiscipline)) {
			return [rawDiscipline, ...values]
		}

		return values
	}, [lessons, localeCode, rawDiscipline])
	const groupOptions = useMemo(() => {
		const values = Array.from(new Set(lessons.map((lesson) => lesson.group?.name).filter(Boolean))).sort((a, b) =>
			a.localeCompare(b, localeCode),
		)

		if (rawGroup !== ALL_FILTER && !values.includes(rawGroup)) {
			return [rawGroup, ...values]
		}

		return values
	}, [lessons, localeCode, rawGroup])

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

	const setCurrentPage = (newPage: number) => {
		updateSearchParams({ page: newPage })
	}

	const setPageSize = (newSize: number) => {
		updateSearchParams({ pageSize: newSize, page: 1 })
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
			<PageTitle description={t.pageDescription}>{t.pageTitle}</PageTitle>

			<Alert>
				<AlertDescription>
					{t.alertDescription}{' '}
					<Link className='underline underline-offset-4' href='/rups/my'>
						{t.goToRups}
					</Link>
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='text-base'>{t.filterTitle}</CardTitle>
					<CardDescription>{t.filterDescription}</CardDescription>
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
								placeholder={t.searchPlaceholder}
							/>
						</div>

						<Select
							value={selectedType}
							onValueChange={(value) =>
								updateSearchParams({ type: value === ALL_FILTER ? null : value, page: 1 })
							}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder={t.lessonType} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER}>{t.allTypes}</SelectItem>
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
							<SelectTrigger className='w-full'>
								<SelectValue placeholder={t.discipline} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER}>{t.allDisciplines}</SelectItem>
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
							<SelectTrigger className='w-full'>
								<SelectValue placeholder={t.group} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_FILTER}>{t.allGroups}</SelectItem>
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
								{t.apply}
							</Button>
							<Button type='button' variant='outline' onClick={clearFilters}>
								{t.reset}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{lessons.length > 0 ? (
				<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
					{lessons.map((lesson) => {
						const TypeIcon = lessonTypeIcons[lesson.type]

						return (
							<Card key={lesson.id} className='flex h-full flex-col'>
								<CardHeader className='gap-3'>
									<CardTitle className='line-clamp-2 text-base leading-snug'>
										{lesson.topic_name || t.untitled}
									</CardTitle>

									<CardDescription className='line-clamp-3'>
										{getLessonDescription(lesson, t.lessonDescriptionFallback)}
									</CardDescription>
								</CardHeader>

								<CardContent className='mt-auto flex flex-1 flex-col gap-4 text-sm'>
									<div className='flex flex-col gap-3 text-muted-foreground'>
										<div className='flex items-center gap-2'>
											<TypeIcon className='size-4' />
											<span>{lessonTypeLabels[lesson.type]}</span>
										</div>
										<div className='flex flex-col gap-1'>
											<p className='text-xs uppercase tracking-wide'>{t.rup}</p>
											<p className='font-medium text-foreground'>{lesson.rup_name || t.notSpecified}</p>
										</div>
										<div className='flex flex-col gap-1'>
											<p className='text-xs uppercase tracking-wide'>{t.discipline}</p>
											<p className='font-medium text-foreground'>{lesson.discipline_name || t.notSpecifiedFemale}</p>
										</div>
										<div className='flex items-center gap-2'>
											<Users className='size-4' />
											<span>{lesson.group?.name || t.groupNotSpecified}</span>
										</div>
										<div className='flex items-center gap-2'>
											<Calendar className='size-4' />
											<span>{formatLessonDate(lesson.event_date, locale, t.dateNotSpecified)}</span>
										</div>
									</div>

									<Button asChild className='mt-auto w-full' size='sm'>
										<Link href={`/lessons/${lesson.id}`}>
											<FileText data-icon='inline-start' />
											{t.openPlan}
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
						<p className='text-base font-medium'>{t.emptyTitle}</p>
						<p className='mt-2 text-sm text-muted-foreground'>{t.emptyDescription}</p>
					</CardContent>
				</Card>
			)}

			<Pagination
				page={data?.meta.currentPage || page}
				pageSize={data?.meta.pageSize || pageSize}
				pageSizeOptions={PAGE_SIZE_OPTIONS}
				totalPages={data?.meta.pages || 1}
				onPageChange={setCurrentPage}
				onPageSizeChange={setPageSize}
			/>
		</section>
	)
}
