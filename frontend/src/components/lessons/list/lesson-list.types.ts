import type { ReactNode } from 'react'

import type { LessonTypeEnum } from '@types'
import type { ILesson } from '@types'

export type LessonListRow = {
	id: string
	lesson: ILesson
	planNumber: string
	topic: string
	description: string
	discipline: string
	group: string
	date: string
	type: LessonTypeEnum
	typeLabel: string
}

export type LessonListGroup = {
	count: number
	id: string
	lessons: LessonListRow[]
	title: string
}

export type LessonListCardLabels = {
	date: string
	discipline: string
	group: string
	groupNotSpecified: string
	lessonType: string
	notSpecifiedFemale: string
	planNumber: string
	topic: string
}

export type LessonListCardEmptyState = {
	description: string
	actionLabel?: string
	actionHref?: string
	title: string
}

export type LessonListCardProps = {
	currentPage: number
	description?: ReactNode
	emptyState: LessonListCardEmptyState
	groups: LessonListGroup[]
	isLoading: boolean
	labels: LessonListCardLabels
	onPageChange: (page: number) => void
	onPageSizeChange: (pageSize: number) => void
	pageSize: number
	pageSizeOptions: number[]
	totalPages: number
	title: ReactNode
}

export type LessonListFilterOption = {
	label: string
	value: string
}

export type LessonListFiltersCardProps = {
	allDisciplinesLabel: string
	allGroupsLabel: string
	allTypesLabel: string
	className?: string
	description?: ReactNode
	disciplineOptions: LessonListFilterOption[]
	disciplinePlaceholder: string
	groupOptions: LessonListFilterOption[]
	groupPlaceholder: string
	lessonTypeLabel: string
	lessonTypeOptions: LessonListFilterOption[]
	onDisciplinesChange: (value: string[]) => void
	onGroupsChange: (value: string[]) => void
	onReset: () => void
	onSearchChange: (search: string) => void
	onSortChange: (value: 'asc' | 'desc') => void
	onTypesChange: (value: string[]) => void
	pageSizeLabel?: string
	resetLabel: string
	searchDefaultValue: string
	searchPlaceholder: string
	selectedDisciplines: string[]
	selectedGroups: string[]
	selectedSort: 'asc' | 'desc'
	selectedTypes: string[]
	sortPlaceholder: string
	sortNewestLabel: string
	sortOldestLabel: string
	sortLabel?: string
	title: ReactNode
}
