import { UserRoleEnum } from '@types'

// has role
export const hasRole = (current: UserRoleEnum, target: UserRoleEnum): boolean => {
	switch (current) {
		case UserRoleEnum.ADMIN:
			return true
		case UserRoleEnum.METHODIST:
			return target === UserRoleEnum.METHODIST
		case UserRoleEnum.TEACHER:
			return target === UserRoleEnum.TEACHER
		default:
			return false
	}
}

// normalize user role
export const userRoleLabels: Record<UserRoleEnum, string> = {
	ADMIN: 'Администратор',
	METHODIST: 'Методист',
	TEACHER: 'Преподаватель',
}

export const normalizeUserRole = (role: UserRoleEnum): string => {
	return userRoleLabels[role]
}

// pluralize
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

// format hours
export const formatHours = (count: number): string => {
	const word = pluralize(count, 'час', 'часа', 'часов')

	return `${count} ${word}`
}
