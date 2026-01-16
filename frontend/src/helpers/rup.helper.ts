import type { ICreateDiscipline, IDiscipline, RupStatusEnum, RupTypeEnum, StudyFormEnum } from '@types'

// status
export const rupStatusLabels: Record<RupStatusEnum, string> = {
	DRAFT: 'Черновик',
	IN_REVIEW: 'На согласовании',
	APPROVED: 'Утверждён',
	REJECTED: 'Отклонен',
}

export const rupStatusVariants: Record<RupStatusEnum, 'default' | 'destructive' | 'outline' | 'secondary'> = {
	DRAFT: 'outline',
	IN_REVIEW: 'secondary',
	APPROVED: 'default',
	REJECTED: 'destructive',
}

export const normalizeRupStatus = (status: RupStatusEnum): string => {
	return rupStatusLabels[status] ?? ''
}

// status
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
			code: '',
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
