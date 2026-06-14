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
import { useAuthStore, useLocaleStore, usePaginationSettingsStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { ILesson, LessonTypeEnum } from '@types'

import localeDictionary from './locale.json'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const parseMultiParam = (value: string | null): string[] => {
	if (!value) return []

	const seen = new Set<string>()
	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => {
			if (!item || seen.has(item)) return false
			seen.add(item)
			return true
		})
}

const toMultiParam = (values: string[]) => {
	const nextValue = values
		.map((value) => value.trim())
		.filter(Boolean)
		.join(',')

	return nextValue || null
}

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
	const storedPageSize = usePaginationSettingsStore((state) => state.pageSize)
	const setStoredPageSize = usePaginationSettingsStore((state) => state.setPageSize)
	const pageSize = Number(searchParams.get('pageSize')) || storedPageSize
	const search = (searchParams.get('q') || '').trim()
	const rawTypes = parseMultiParam(searchParams.get('type'))
	const rawDisciplines = parseMultiParam(searchParams.get('discipline'))
	const rawGroups = parseMultiParam(searchParams.get('group'))
	const sortParam = searchParams.get('sort') || 'desc'
	const selectedTypes = rawTypes.filter((value): value is LessonTypeEnum =>
		Object.keys(lessonTypeLabels).includes(value),
	)
	const selectedDisciplines = rawDisciplines
	const selectedGroups = rawGroups
	const selectedSort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : 'desc'
	const hasActiveFilters =
		Boolean(search) ||
		selectedTypes.length > 0 ||
		selectedDisciplines.length > 0 ||
		selectedGroups.length > 0 ||
		selectedSort !== 'desc'

	const { data: filterData, isLoading: isFilterDataLoading } = useQuery({
		...services.lesson.getUserFilterDataOptions(locale),
		enabled: !authLoading && !!user,
	})

	const { data, isLoading } = useQuery({
		...services.lesson.getAllOptions({
			currentPage: page,
			pageSize,
			search: search || undefined,
			type: selectedTypes,
			discipline: selectedDisciplines,
			group: selectedGroups,
			sort: selectedSort as 'asc' | 'desc',
		}),
		enabled: !authLoading && !!user,
	})

	const lessons = data?.data || []
	const localeCode = locale === 'kk' ? 'kk-KZ' : 'ru-RU'

	const lessonTypeOptions = useMemo<LessonListFilterOption[]>(
		() =>
			(filterData?.types?.length
				? filterData.types
				: Object.keys(lessonTypeLabels).map((value) => ({ value, label: value }))
			)
				.filter((option) => Object.keys(lessonTypeLabels).includes(option.value))
				.map((option) => ({
					value: option.value,
					label: lessonTypeLabels[option.value as LessonTypeEnum] || option.label,
				})),
		[filterData?.types, lessonTypeLabels],
	)

	const disciplineOptions = useMemo<LessonListFilterOption[]>(
		() =>
			(filterData?.disciplines || [])
				.map((option) => ({ value: option.value, label: option.label || option.value }))
				.sort((a, b) => a.label.localeCompare(b.label, localeCode)),
		[filterData?.disciplines, localeCode],
	)

	const groupOptions = useMemo<LessonListFilterOption[]>(
		() =>
			(filterData?.groups || [])
				.map((option) => ({ value: option.value, label: option.label || option.value }))
				.sort((a, b) => a.label.localeCompare(b.label, localeCode)),
		[filterData?.groups, localeCode],
	)

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
		setStoredPageSize(newSize)
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

	if (authLoading || !user) {
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
				allGroupsLabel={t.allGroups}
				allTypesLabel={t.allTypes}
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
				selectedDisciplines={selectedDisciplines}
				selectedGroups={selectedGroups}
				selectedSort={selectedSort}
				selectedTypes={selectedTypes}
				sortNewestLabel={t.sortNewest}
				sortOldestLabel={t.sortOldest}
				sortPlaceholder={t.sortBy}
				title={t.filterTitle}
				onDisciplinesChange={(value) => updateSearchParams({ discipline: toMultiParam(value), page: 1 })}
				onGroupsChange={(value) => updateSearchParams({ group: toMultiParam(value), page: 1 })}
				onReset={clearFilters}
				onSearchChange={(value) => updateSearchParams({ q: value || null, page: 1 })}
				onSortChange={(value) => updateSearchParams({ sort: value, page: 1 })}
				onTypesChange={(value) => updateSearchParams({ type: toMultiParam(value), page: 1 })}
			/>

			{(!isLoading || isFilterDataLoading) && (
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
			)}
		</section>
	)
}

export default withNavAccess(MyLessonPlansPage)

const getLessonText = (
	value: ILesson['rup_name'] | ILesson['discipline_name'] | ILesson['topic_name'],
	locale: 'ru' | 'kk',
) => getLocaleText(value, locale)
