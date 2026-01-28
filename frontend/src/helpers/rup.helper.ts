import type { ForwardRefExoticComponent, RefAttributes } from 'react'

import { cn } from '@lib'
import type { badgeVariants } from '@shadcn'
import type {
	ICreateDiscipline,
	ICreateSemester,
	IDiscipline,
	ISemester,
	RupTypeEnum,
	StudyFormEnum,
	TopicTypeEnum,
} from '@types'
import type { VariantProps } from 'class-variance-authority'
import { Combine, FlaskConical, type LucideProps, NotebookPen } from 'lucide-react'

// rup type
export const rupTypeLabels: Record<RupTypeEnum, string> = {
	PRACTICE: 'Производственно-практический',
	THEORY: 'Теоретический',
}

export const normalizeRupType = (status: RupTypeEnum): string => {
	return rupTypeLabels[status] ?? ''
}

// study form
export const studyFormLabels: Record<StudyFormEnum, string> = {
	CORRESPONDENCE: 'Заочная',
	FULL_TIME: 'Очная',
}

export const normalizeStudyForm = (studyForm: StudyFormEnum): string => {
	return studyFormLabels[studyForm] ?? ''
}

// topic type
export const topicTypeLabels: Record<TopicTypeEnum, string> = {
	COMBINED: 'Комбинированный',
	PRACTICAL: 'Практический',
	SNZ: 'СНЗ',
}

export const topicTypeVariants: Record<TopicTypeEnum, VariantProps<typeof badgeVariants>['variant']> = {
	COMBINED: 'default',
	PRACTICAL: 'secondary',
	SNZ: 'outline',
}

export const topicTypeIcons: Record<
	TopicTypeEnum,
	ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
> = {
	COMBINED: Combine,
	PRACTICAL: FlaskConical,
	SNZ: NotebookPen,
}

export const normalizeTopicType = (studyForm: TopicTypeEnum): string => {
	return topicTypeLabels[studyForm] ?? ''
}

// hours styles
export const getHoursStyle = (value: number | undefined, customClass?: string, customGhostClass?: string): string => {
	const className = customClass ?? 'text-foreground'
	const ghostClassName = customGhostClass ?? 'text-muted-foreground/80'

	return cn('text-center', (Number(value) || 0) === 0 ? ghostClassName : className)
}

// generate study years
export const generateStudyYears = (diapason: number = 6): string[] => {
	const currentYear = new Date().getFullYear()
	const years: string[] = []

	for (let i = diapason; i >= -diapason; i--) {
		const startYear = currentYear + i
		const endYear = startYear + 1

		years.push(`${startYear}-${endYear}`)
	}

	return years
}

// generate template
interface ICreateDisciplineWithTotalHours extends ICreateDiscipline {
	totalHours: IDiscipline['totalHours']
}

export const generateTemplateDisciplines = (
	count: number = 1,
	semesters: number = 8,
): ICreateDisciplineWithTotalHours[] => {
	const result: ICreateDisciplineWithTotalHours[] = []

	for (let i = 0; i < count; i++) {
		result.push({
			name: '',
			totalHours: 0,
			semesters: [],
			topics: [],
		})

		for (let j = 0; j < semesters; j++) {
			result[i].semesters?.push({
				semester: j + 1,
				totalHours: 0,
			})
		}
	}

	return result
}

// format course from year and group name
export const formatCourseFromYearAndGroupName = (groupName: string, year: string): number | string => {
	// Extract the two-digit year from the group name, e.g., "25" from "WEB25-A"
	const groupYearMatch = groupName.match(/\d+/)

	if (!groupYearMatch) {
		return 'Неверный формат группы'
	}

	// Assuming we are in the 21st century, prepend "20" to get a full year like 2025.
	const groupFormationYear = 2000 + parseInt(groupYearMatch[0], 10)

	// Extract the starting year from the academic year string, e.g., "2025" from "2025-2026"
	const academicYearStartMatch = year.match(/^\d{4}/)

	if (!academicYearStartMatch) {
		return 'Неверный формат года'
	}

	const academicYearStart = parseInt(academicYearStartMatch[0], 10)

	// Calculate the course
	const course = academicYearStart - groupFormationYear + 1

	// Validate the result. A course should be between 1 and 4.
	if (course < 1 || course > 4) {
		return 'Неверное соотношение группы и года'
	}

	return course
}

// get total discipline hours
export const getTotalDisciplineHours = (semesters: ISemester[] | ICreateSemester[]): number => {
	return semesters.reduce((acc, curr) => acc + curr.totalHours, 0)
}

// get total hours for all disciplines
export const getTotalHoursForAllDisciplines = (disciplines: IDiscipline[]): number => {
	return disciplines.reduce((acc, disc) => acc + getTotalDisciplineHours(disc.semesters), 0)
}
