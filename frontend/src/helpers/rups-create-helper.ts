interface IDiscipline {
	code?: string | undefined
	name?: string | undefined
	totalCredits?: number | undefined
	semesters?: {
		semester?: number | undefined
		credits?: number | undefined
	}[]
}

export const generateTemplateDisciplines = (count: number = 1, semesters: number = 0): IDiscipline[] => {
	const result: IDiscipline[] = []

	for (let i = 0; i < count; i++) {
		result.push({
			name: '',
			code: '',
			totalCredits: 0,
			semesters: [],
		})

		for (let j = 0; j < semesters; j++) {
			result[i].semesters?.push({
				semester: j + 1,
				credits: 0,
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

export const formatCredits = (count: number): string => {
	const word = pluralize(count, 'кредит', 'кредита', 'кредитов')

	return `${count} ${word}`
}

export const formatHours = (count: number): string => {
	const word = pluralize(count, 'час', 'часа', 'часов')

	return `${count} ${word}`
}
