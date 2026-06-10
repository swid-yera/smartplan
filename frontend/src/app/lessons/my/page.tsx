'use client'

import { useMemo } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
	LessonGroupedListCard,
	type LessonListFilterOption,
	LessonListFiltersCard,
	type LessonListGroup,
	type LessonListRow,
	Loader,
	PageTitle,
	withNavAccess,
} from '@components'
import { getLessonTypeLabels, getLocaleText, getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Alert, AlertDescription, Button } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { ILesson, LessonTypeEnum } from '@types'

import localeDictionary from './locale.json'

const ALL_FILTER = 'ALL'
const PAGE_SIZE_OPTIONS = [10, 20, 50]

const getLessonDescription = (lesson: ILesson, locale: 'ru' | 'kk', fallback: string): string => {
	const description = [lesson.goals, lesson.tasks, lesson.expected]
		.map((item) => getLocaleText(item, locale))
		.find((item) => item.trim())

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

function MyLessonPlansPage() {
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
	const sortParam = searchParams.get('sort') || 'desc'
	const selectedType = Object.keys(lessonTypeLabels).includes(rawType) ? (rawType as LessonTypeEnum) : ALL_FILTER
	const selectedDiscipline = rawDiscipline
	const selectedGroup = rawGroup
	const selectedSort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : 'desc'
	const hasActiveFilters =
		Boolean(search) ||
		selectedType !== ALL_FILTER ||
		selectedDiscipline !== ALL_FILTER ||
		selectedGroup !== ALL_FILTER ||
		selectedSort !== 'desc'

	const { data, isLoading } = useQuery({
		...services.lesson.getAllOptions({
			currentPage: page,
			pageSize,
			search: search || undefined,
			teacher: user?.keycloakId,
			type: selectedType === ALL_FILTER ? undefined : selectedType,
			discipline: selectedDiscipline === ALL_FILTER ? undefined : selectedDiscipline,
			group: selectedGroup === ALL_FILTER ? undefined : selectedGroup,
			sort: selectedSort as 'asc' | 'desc',
		}),
		enabled: !authLoading && !!user,
	})

	const lessons = data?.data || []
	const localeCode = locale === 'kk' ? 'kk-KZ' : 'ru-RU'

	const lessonTypeOptions = useMemo<LessonListFilterOption[]>(
		() => Object.entries(lessonTypeLabels).map(([value, label]) => ({ label, value })),
		[lessonTypeLabels],
	)

	const disciplineOptions = useMemo<LessonListFilterOption[]>(() => {
		const values = Array.from(
			new Set(
				lessons.map((lesson) => getLessonText(lesson.discipline_name, locale)).filter((value) => Boolean(value)),
			),
		).sort((a, b) => a.localeCompare(b, localeCode))

		if (rawDiscipline !== ALL_FILTER && !values.includes(rawDiscipline)) {
			return [{ label: rawDiscipline, value: rawDiscipline }, ...values.map((value) => ({ label: value, value }))]
		}

		return values.map((value) => ({ label: value, value }))
	}, [lessons, locale, localeCode, rawDiscipline])

	const groupOptions = useMemo<LessonListFilterOption[]>(() => {
		const values = Array.from(
			new Set(lessons.map((lesson) => lesson.group?.name).filter((value): value is string => Boolean(value))),
		).sort((a, b) => a.localeCompare(b, localeCode))

		if (rawGroup !== ALL_FILTER && !values.includes(rawGroup)) {
			return [{ label: rawGroup, value: rawGroup }, ...values.map((value) => ({ label: value, value }))]
		}

		return values.map((value) => ({ label: value, value }))
	}, [lessons, localeCode, rawGroup])

	const groupedLessons = useMemo<LessonListGroup[]>(() => {
		const groups = new Map<string, LessonListGroup>()

		for (const lesson of lessons) {
			const title = getLessonText(lesson.rup_name, locale) || t.notSpecified
			const key = lesson.rupId || lesson.rup_id || title || lesson.id
			const current = groups.get(key)
			const row: LessonListRow = {
				date: formatLessonDate(lesson.event_date, locale, t.dateNotSpecified),
				description: getLessonDescription(lesson, locale, t.lessonDescriptionFallback),
				discipline: getLessonText(lesson.discipline_name, locale) || t.notSpecifiedFemale,
				group: lesson.group?.name || t.groupNotSpecified,
				id: lesson.id,
				lesson,
				planNumber: String(lesson.plan_number ?? ''),
				topic: getLessonText(lesson.topic_name, locale) || t.untitled,
				type: lesson.type,
				typeLabel: lessonTypeLabels[lesson.type],
			}

			if (current) {
				current.count += 1
				current.lessons.push(row)
				continue
			}

			groups.set(key, {
				count: 1,
				id: key,
				lessons: [row],
				title,
			})
		}

		return Array.from(groups.values()).sort((left, right) => left.title.localeCompare(right.title, localeCode))
	}, [
		lessons,
		locale,
		localeCode,
		lessonTypeLabels,
		t.dateNotSpecified,
		t.groupNotSpecified,
		t.lessonDescriptionFallback,
		t.notSpecified,
		t.notSpecifiedFemale,
		t.untitled,
	])

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

	const clearFilters = () => {
		updateSearchParams({
			q: null,
			type: null,
			discipline: null,
			group: null,
			sort: 'desc',
			page: 1,
		})
	}

	if (authLoading || isLoading || !user) {
		return <Loader type='data' />
	}

	return (
		<section className='mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6'>
			<PageTitle description={t.pageDescription}>{t.pageTitle}</PageTitle>

			<Alert className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
				<AlertDescription>{t.alertDescription}</AlertDescription>
				<Button asChild className='w-full md:w-auto' variant='outline'>
					<Link href='/rups/all'>{t.goToRups}</Link>
				</Button>
			</Alert>

			<LessonListFiltersCard
				allDisciplinesLabel={t.allDisciplines}
				allFilterValue={ALL_FILTER}
				allGroupsLabel={t.allGroups}
				allTypesLabel={t.allTypes}
				applyLabel={t.apply}
				description={t.filterDescription}
				disciplineOptions={disciplineOptions}
				disciplinePlaceholder={t.discipline}
				groupOptions={groupOptions}
				groupPlaceholder={t.group}
				lessonTypeLabel={t.lessonType}
				lessonTypeOptions={lessonTypeOptions}
				resetLabel={t.reset}
				searchDefaultValue={search}
				searchPlaceholder={t.searchPlaceholder}
				selectedDiscipline={selectedDiscipline}
				selectedGroup={selectedGroup}
				selectedSort={selectedSort}
				selectedType={selectedType}
				sortNewestLabel={t.sortNewest}
				sortOldestLabel={t.sortOldest}
				sortPlaceholder={t.sortBy}
				title={t.filterTitle}
				onDisciplineChange={(value) =>
					updateSearchParams({ discipline: value === ALL_FILTER ? null : value, page: 1 })
				}
				onGroupChange={(value) => updateSearchParams({ group: value === ALL_FILTER ? null : value, page: 1 })}
				onReset={clearFilters}
				onSearchSubmit={(value) => updateSearchParams({ q: value || null, page: 1 })}
				onSortChange={(value) => updateSearchParams({ sort: value, page: 1 })}
				onTypeChange={(value) => updateSearchParams({ type: value === ALL_FILTER ? null : value, page: 1 })}
			/>

			<LessonGroupedListCard
				currentPage={data?.meta.currentPage || page}
				description={t.listDescription || t.pageDescription}
				emptyState={{
					actionHref: '/rups/all',
					actionLabel: t.emptyNoDataAction,
					description: hasActiveFilters ? t.emptyFilteredDescription : t.emptyNoDataDescription,
					title: hasActiveFilters ? t.emptyFilteredTitle : t.emptyNoDataTitle,
				}}
				groups={groupedLessons}
				isLoading={isLoading}
				labels={{
					date: t.date,
					discipline: t.discipline,
					group: t.group,
					groupNotSpecified: t.groupNotSpecified,
					lessonType: t.lessonType,
					notSpecifiedFemale: t.notSpecifiedFemale,
					planNumber: t.planNumber,
					topic: t.topic,
				}}
				pageSize={data?.meta.pageSize || pageSize}
				pageSizeOptions={PAGE_SIZE_OPTIONS}
				title={t.listTitle || t.pageTitle}
				totalPages={data?.meta.pages || 1}
				onPageChange={setCurrentPage}
				onPageSizeChange={setPageSize}
			/>
		</section>
	)
}

export default withNavAccess(MyLessonPlansPage)

const getLessonText = (
	value: ILesson['rup_name'] | ILesson['discipline_name'] | ILesson['topic_name'],
	locale: 'ru' | 'kk',
) => getLocaleText(value, locale)
