import { type UserTypeEnum } from '@types'
import { type LucideIcon } from 'lucide-react'

export type SortOrder = 'desc' | 'asc'

export type FilteredUserType = UserTypeEnum.GENERAL | UserTypeEnum.SPECIALIST | UserTypeEnum.MASTER

export type DepartmentOption = {
	id: string
	label: string
}

export type SummaryCardTheme = {
	accent: string
	bg: string
	border: string
	iconBg: string
	valueClassName: string
}

export type SummaryCardConfig = {
	description: string
	icon: LucideIcon
	theme: SummaryCardTheme
	title: string
	value: string
}

export type RatingStatsChartItem = {
	keycloakId?: string
	name: string
	value: number
	departments?: string[]
}

export type RatingStatsTexts = {
	allDepartments: string
	allTeachers: string
	allTypes: string
	averageDescription: string
	averageTitle: string
	departments: string
	departmentsCountDescription: string
	departmentsCountTitle: string
	description: string
	distribution: string
	emptyDescription: string
	emptyTitle: string
	filtersDescription: string
	filtersTitle: string
	general: string
	headerDescription: string
	headerTitle: string
	master: string
	noMatchesDescription: string
	noMatchesTitle: string
	points: string
	resetFilters: string
	departmentLabel: string
	searchLabel: string
	searchPlaceholder: string
	sortAsc: string
	sortDesc: string
	sortLabel: string
	specialist: string
	stats: string
	tableDepartment: string
	tableIndex: string
	tableName: string
	tablePoints: string
	tableTitle: string
	tableType: string
	teachersCountDescription: string
	teachersCountTitle: string
	title: string
	top20: string
	typeLabel: string
}
