import type { ForwardRefExoticComponent, RefAttributes } from 'react'

import { cn } from '@lib'
import type { badgeVariants } from '@shadcn'
import type {
	ICreateDiscipline,
	ICreateSemester,
	IDiscipline,
	ISemester,
	Locale,
	RupTypeEnum,
	StudyFormEnum,
	TopicTypeEnum,
} from '@types'
import type { VariantProps } from 'class-variance-authority'
import { Combine, FlaskConical, type LucideProps, NotebookPen } from 'lucide-react'

// rup type
const rupTypeLabelsByLocale: Record<Locale, Record<RupTypeEnum, string>> = {
	ru: {
		PRACTICE: 'Производственно-практический',
		THEORY: 'Теоретический',
	},
	kk: {
		PRACTICE: 'Өндірістік-практикалық',
		THEORY: 'Теориялық',
	},
}

export const rupTypeLabels: Record<RupTypeEnum, string> = rupTypeLabelsByLocale.ru
export const getRupTypeLabels = (locale: Locale = 'ru'): Record<RupTypeEnum, string> => {
	return rupTypeLabelsByLocale[locale] || rupTypeLabelsByLocale.ru
}

export const normalizeRupType = (status: RupTypeEnum, locale: Locale = 'ru'): string => {
	return getRupTypeLabels(locale)[status] ?? ''
}

// study form
const studyFormLabelsByLocale: Record<Locale, Record<StudyFormEnum, string>> = {
	ru: {
		CORRESPONDENCE: 'Заочная',
		FULL_TIME: 'Очная',
	},
	kk: {
		CORRESPONDENCE: 'Сырттай',
		FULL_TIME: 'Күндізгі',
	},
}

export const studyFormLabels: Record<StudyFormEnum, string> = studyFormLabelsByLocale.ru
export const getStudyFormLabels = (locale: Locale = 'ru'): Record<StudyFormEnum, string> => {
	return studyFormLabelsByLocale[locale] || studyFormLabelsByLocale.ru
}

export const normalizeStudyForm = (studyForm: StudyFormEnum, locale: Locale = 'ru'): string => {
	return getStudyFormLabels(locale)[studyForm] ?? ''
}

// topic type
const topicTypeLabelsByLocale: Record<Locale, Record<TopicTypeEnum, string>> = {
	ru: {
		COMBINED: 'Комбинированный',
		PRACTICAL: 'Практический',
		SNZ: 'СНЗ',
	},
	kk: {
		COMBINED: 'Аралас',
		PRACTICAL: 'Практикалық',
		SNZ: 'СӨЖ',
	},
}

export const topicTypeLabels: Record<TopicTypeEnum, string> = topicTypeLabelsByLocale.ru
export const getTopicTypeLabels = (locale: Locale = 'ru'): Record<TopicTypeEnum, string> => {
	return topicTypeLabelsByLocale[locale] || topicTypeLabelsByLocale.ru
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

export const normalizeTopicType = (studyForm: TopicTypeEnum, locale: Locale = 'ru'): string => {
	return getTopicTypeLabels(locale)[studyForm] ?? ''
}

// hours styles
export const getHoursStyle = (value: number | undefined, customClass?: string, customGhostClass?: string): string => {
	const className = customClass ?? 'text-foreground'
	const ghostClassName = customGhostClass ?? 'text-muted-foreground/80'

	return cn('text-center', (Number(value) || 0) === 0 ? ghostClassName : className)
}

// generate study years by group name
export const generateStudyYears = (groupYear: number): string[] => {
	const years: string[] = []

	for (let i = 0; i <= 3; i++) {
		const startYear = groupYear + i
		const endYear = startYear + 1

		years.push(`${startYear}-${endYear}`)
	}

	return years
}

// generate template
interface ICreateDisciplineWithTotalHours extends ICreateDiscipline {
	totalHours: IDiscipline['totalHours']
}

// generate discipline template with semesters
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

// get group year
export const getGroupYear = (groupName: string): number | null => {
	// "WEB25-A" => 2025
	const match = groupName.match(/\d+/)

	return match ? 2000 + parseInt(match[0], 10) : null
}

// format course from year and group name
export const formatCourseFromYearAndGroupName = (groupName: string, year: string): number | string => {
	// extract the two-digit year from the group name, e.g., "25" from "WEB25-A"
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
