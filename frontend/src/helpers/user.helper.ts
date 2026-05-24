import type { badgeVariants } from '@shadcn'
import { type IUser, type Locale, RoleEnum } from '@types'
import type { VariantProps } from 'class-variance-authority'

// has role
export const hasRole = (current: RoleEnum, target: RoleEnum, highestRole = true): boolean => {
	switch (current) {
		case RoleEnum.ADMIN:
			return highestRole ? true : target === RoleEnum.ADMIN
		case RoleEnum.METHODIST:
			return target === RoleEnum.METHODIST
		case RoleEnum.TEACHER:
			return target === RoleEnum.TEACHER
		default:
			return false
	}
}

// define highest role
export const defineHighestRole = (current: RoleEnum): RoleEnum => {
	switch (current) {
		case RoleEnum.ADMIN:
			return RoleEnum.ADMIN
		case RoleEnum.METHODIST:
			return RoleEnum.METHODIST
		case RoleEnum.TEACHER:
			return RoleEnum.TEACHER
		default:
			return RoleEnum.TEACHER
	}
}

// is rup creator
export const isAuthor = (user: IUser, target: string): boolean => {
	if (user.role === RoleEnum.ADMIN) {
		return true
	}
	if (user.role === RoleEnum.TEACHER) {
		return user.keycloakId === target
	}

	return false
}

// user role button variants
export const userRoleButtonVariants: Record<RoleEnum, VariantProps<typeof badgeVariants>['variant']> = {
	ADMIN: 'outline',
	METHODIST: 'default',
	TEACHER: 'secondary',
}

// normalize user role
const userRoleLabelsByLocale: Record<Locale, Record<RoleEnum, string>> = {
	ru: {
		ADMIN: 'Администратор',
		METHODIST: 'Методист',
		TEACHER: 'Преподаватель',
	},
	kk: {
		ADMIN: 'Әкімші',
		METHODIST: 'Әдіскер',
		TEACHER: 'Оқытушы',
	},
}

// backwards-compatible default dictionary
export const userRoleLabels: Record<RoleEnum, string> = userRoleLabelsByLocale.ru

export const getUserRoleLabels = (locale: Locale = 'ru'): Record<RoleEnum, string> => {
	return userRoleLabelsByLocale[locale] || userRoleLabelsByLocale.ru
}

export const normalizeUserRole = (role: RoleEnum, locale: Locale = 'ru'): string => {
	return getUserRoleLabels(locale)[role]
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
