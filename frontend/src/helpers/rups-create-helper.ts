interface IDiscipline {
	code?: string | undefined
	name?: string | undefined
	totalHours?: number | undefined
	semesters?: {
		semester?: number | undefined
		hours?: number | undefined
	}[]
}

export const generateTemplateDisciplines = (count: number = 1, semesters: number = 0): IDiscipline[] => {
	const result: IDiscipline[] = []

	for (let i = 0; i < count; i++) {
		result.push({
			name: '',
			code: '',
			totalHours: 0,
			semesters: [],
		})

		for (let j = 0; j < semesters; j++) {
			result[i].semesters?.push({
				semester: j + 1,
				hours: 0,
			})
		}
	}

	return result
}

const pluralize = (number: number, one: string, two: string, five: string): string => {
	let n = Math.abs(number)

	n %= 100
	if (n >= 5 && n <= 20) {
		return five
	}
	n %= 10
	if (n === 1) {
		return one
	}
	if (n >= 2 && n <= 4) {
		return two
	}

	return five
}

export const formatHours = (count: number): string => {
	const word = pluralize(count, 'час', 'часа', 'часов')

	return `${count} ${word}`
}

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
