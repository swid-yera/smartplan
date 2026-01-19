import { UserRoleEnum } from '@types'
import type { badgeVariants } from '@ui'
import type { VariantProps } from 'class-variance-authority'

// has role
export const hasRole = (current: UserRoleEnum, target: UserRoleEnum, highestRole = true): boolean => {
	switch (current) {
		case UserRoleEnum.ADMIN:
			return highestRole ? true : target === UserRoleEnum.ADMIN
		case UserRoleEnum.METHODIST:
			return target === UserRoleEnum.METHODIST
		case UserRoleEnum.TEACHER:
			return target === UserRoleEnum.TEACHER
		default:
			return false
	}
}

// is rup creator
export const isRupCreator = (role: UserRoleEnum, current: string, target: string): boolean => {
	if (role === UserRoleEnum.ADMIN) {
		return true
	}
	if (role === UserRoleEnum.TEACHER) {
		return current === target
	}

	return false
}

// user role button variants
export const userRoleButtonVariants: Record<UserRoleEnum, VariantProps<typeof badgeVariants>['variant']> = {
	ADMIN: 'outline',
	METHODIST: 'default',
	TEACHER: 'secondary',
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

// prettify phone number
export const prettifyPhone = (phone: string): string => {
	// delete everything except numbers
	const cleaned = phone.replace(/\D/g, '')

	// for 11 length numbers
	if (cleaned.length !== 11) {
		return phone
	}

	// slicing numbers
	const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/)

	if (match) {
		return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`
	}

	return phone
}
