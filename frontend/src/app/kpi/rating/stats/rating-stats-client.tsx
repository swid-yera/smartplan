'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { getLocaleText, getUserTotalPoints, normalizeUserType } from '@helpers'
import { type IUser, type IUserDepartment, type Locale, UserTypeEnum } from '@types'
import { Building2, Sigma, Users } from 'lucide-react'

import { RatingNav } from '../components/rating-nav'
import { RatingStatsDistributionCard } from './components/rating-stats-distribution-card'
import { RatingStatsFilters } from './components/rating-stats-filters'
import { RatingStatsSummaryCards } from './components/rating-stats-summary-cards'
import { RatingStatsTable } from './components/rating-stats-table'
import {
	type DepartmentOption,
	type FilteredUserType,
	type RatingStatsChartItem,
	type RatingStatsTexts,
	type SortOrder,
	type SummaryCardConfig,
} from './rating-stats.types'
import { RATING_COLORS, compareTeacherNames, normalizeTeacherName } from './rating-stats.utils'

interface IProps {
	locale: Locale
	teachers: IUser[]
	t: RatingStatsTexts
}

export const RatingStatsClient = ({ locale, teachers, t }: IProps) => {
	const router = useRouter()
	const [search, setSearch] = useState('')
	const [selectedTypes, setSelectedTypes] = useState<FilteredUserType[]>([])
	const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([])
	const [selectedSort, setSelectedSort] = useState<SortOrder>('desc')

	const departmentOptions = useMemo<DepartmentOption[]>(() => {
		const optionsMap = new Map<string, string>()

		for (const teacher of teachers) {
			for (const department of teacher.departments ?? []) {
				const label = getLocaleText(department.name, locale).trim()

				if (!label) continue

				optionsMap.set(department.keycloakId, label)
			}
		}

		return [...optionsMap.entries()]
			.map(([id, label]) => ({ id, label }))
			.sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }))
	}, [locale, teachers])

	const teachersCount = teachers.length
	const averagePoints = useMemo(() => {
		if (!teachersCount) return 0

		const totalPoints = teachers.reduce((sum, teacher) => sum + getUserTotalPoints(teacher), 0)

		return totalPoints / teachersCount
	}, [teachers, teachersCount])

	const departmentsCount = departmentOptions.length
	const typeOptions = useMemo(
		() =>
			[
				{ value: UserTypeEnum.GENERAL, label: normalizeUserType(UserTypeEnum.GENERAL, locale) },
				{ value: UserTypeEnum.SPECIALIST, label: normalizeUserType(UserTypeEnum.SPECIALIST, locale) },
				{ value: UserTypeEnum.MASTER, label: normalizeUserType(UserTypeEnum.MASTER, locale) },
			] as const,
		[locale],
	)
	const typeOptionsMap = useMemo(
		() =>
			typeOptions.reduce(
				(acc, option) => {
					acc[option.value] = option.label

					return acc
				},
				{} as Record<FilteredUserType, string>,
			),
		[typeOptions],
	)
	const selectedTypeSet = useMemo(() => new Set(selectedTypes), [selectedTypes])
	const selectedDepartmentIdSet = useMemo(() => new Set(selectedDepartmentIds), [selectedDepartmentIds])
	const hasActiveFilters = Boolean(
		search.trim() || selectedTypes.length > 0 || selectedDepartmentIds.length > 0 || selectedSort !== 'desc',
	)

	const toggleSelectedType = (type: FilteredUserType) => {
		setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]))
	}

	const toggleSelectedDepartmentId = (departmentId: string) => {
		setSelectedDepartmentIds((prev) =>
			prev.includes(departmentId) ? prev.filter((item) => item !== departmentId) : [...prev, departmentId],
		)
	}

	const filteredTeachers = useMemo(() => {
		const query = search.trim().toLowerCase()

		const result = teachers.filter((teacher) => {
			if (selectedTypes.length > 0 && !selectedTypeSet.has(teacher.userType as FilteredUserType)) {
				return false
			}

			if (selectedDepartmentIds.length > 0) {
				const hasDepartment = (teacher.departments ?? []).some((department) =>
					selectedDepartmentIdSet.has(department.keycloakId),
				)

				if (!hasDepartment) {
					return false
				}
			}

			if (!query) {
				return true
			}

			const fullName = normalizeTeacherName(teacher).toLowerCase()
			const username = (teacher.username ?? '').toLowerCase()

			return fullName.includes(query) || username.includes(query)
		})

		return result.sort((left, right) => {
			const leftPoints = getUserTotalPoints(left)
			const rightPoints = getUserTotalPoints(right)

			if (leftPoints !== rightPoints) {
				return selectedSort === 'desc' ? rightPoints - leftPoints : leftPoints - rightPoints
			}

			return compareTeacherNames(left, right, locale)
		})
	}, [
		locale,
		teachers,
		search,
		selectedDepartmentIdSet,
		selectedSort,
		selectedTypeSet,
		selectedTypes.length,
		selectedDepartmentIds.length,
	])

	const chartData: RatingStatsChartItem[] = useMemo(
		() =>
			filteredTeachers.map((teacher) => ({
				keycloakId: teacher.keycloakId,
				name: normalizeTeacherName(teacher),
				value: getUserTotalPoints(teacher),
				departments: (teacher.departments ?? [])
					.map((department: IUserDepartment) => getLocaleText(department.name, locale))
					.filter(Boolean),
			})),
		[filteredTeachers, locale],
	)

	const summaryCards: SummaryCardConfig[] = [
		{
			description: t.averageDescription,
			icon: Sigma,
			theme: {
				accent: 'var(--chart-1)',
				bg: 'color-mix(in oklch, var(--chart-1) 10%, var(--background))',
				border: 'color-mix(in oklch, var(--chart-1) 18%, var(--border))',
				iconBg: 'color-mix(in oklch, var(--chart-1) 18%, transparent)',
				valueClassName: 'text-3xl md:text-4xl',
			},
			title: t.averageTitle,
			value: averagePoints.toFixed(1),
		},
		{
			description: t.teachersCountDescription,
			icon: Users,
			theme: {
				accent: 'var(--chart-2)',
				bg: 'color-mix(in oklch, var(--chart-2) 10%, var(--background))',
				border: 'color-mix(in oklch, var(--chart-2) 18%, var(--border))',
				iconBg: 'color-mix(in oklch, var(--chart-2) 18%, transparent)',
				valueClassName: 'text-2xl md:text-3xl',
			},
			title: t.teachersCountTitle,
			value: String(teachersCount),
		},
		{
			description: t.departmentsCountDescription,
			icon: Building2,
			theme: {
				accent: 'var(--chart-3)',
				bg: 'color-mix(in oklch, var(--chart-3) 10%, var(--background))',
				border: 'color-mix(in oklch, var(--chart-3) 18%, var(--border))',
				iconBg: 'color-mix(in oklch, var(--chart-3) 18%, transparent)',
				valueClassName: 'text-2xl md:text-3xl',
			},
			title: t.departmentsCountTitle,
			value: String(departmentsCount),
		},
	]

	return (
		<section className='mx-auto flex w-full max-w-6xl flex-col gap-6 p-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>
			<RatingNav
				labels={{
					departments: t.departments,
					stats: t.stats,
					top20: t.top20,
				}}
			/>

			<RatingStatsSummaryCards cards={summaryCards} />

			<RatingStatsDistributionCard
				barColors={RATING_COLORS}
				baseTeachersCount={teachersCount}
				chartData={chartData}
				filteredTeachers={filteredTeachers}
				t={t}
				valueLabel={t.points}
				onPointClick={(teacher) => {
					if (!teacher.keycloakId) return

					router.push(`/users/${teacher.keycloakId}?tab=kpi`)
				}}
			/>

			<RatingStatsFilters
				departmentOptions={departmentOptions}
				hasActiveFilters={hasActiveFilters}
				search={search}
				selectedDepartmentIds={selectedDepartmentIds}
				selectedSort={selectedSort}
				selectedTypes={selectedTypes}
				t={{
					allDepartments: t.allDepartments,
					allTypes: t.allTypes,
					departmentLabel: t.departmentLabel,
					resetFilters: t.resetFilters,
					searchPlaceholder: t.searchPlaceholder,
					sortAsc: t.sortAsc,
					sortDesc: t.sortDesc,
					sortLabel: t.sortLabel,
					typeLabel: t.typeLabel,
				}}
				typeOptions={typeOptions.map((option) => ({
					label: typeOptionsMap[option.value],
					value: option.value,
				}))}
				onDepartmentToggle={toggleSelectedDepartmentId}
				onReset={() => {
					setSearch('')
					setSelectedTypes([])
					setSelectedDepartmentIds([])
					setSelectedSort('desc')
				}}
				onSearchChange={setSearch}
				onSortChange={setSelectedSort}
				onTypeToggle={toggleSelectedType}
			/>

			<RatingStatsTable
				baseTeachersCount={teachersCount}
				filteredTeachers={filteredTeachers}
				locale={locale}
				t={{
					emptyDescription: t.emptyDescription,
					emptyTitle: t.emptyTitle,
					noMatchesDescription: t.noMatchesDescription,
					noMatchesTitle: t.noMatchesTitle,
					tableDepartment: t.tableDepartment,
					tableIndex: t.tableIndex,
					tableName: t.tableName,
					tablePoints: t.tablePoints,
					tableTitle: t.tableTitle,
					tableType: t.tableType,
				}}
			/>
		</section>
	)
}
