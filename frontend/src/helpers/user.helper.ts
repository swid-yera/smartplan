import type { badgeVariants } from '@shadcn'
import { type IUser, type Locale, RoleEnum, ViolationEnum } from '@types'
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
		TEACHER: 'Мұғалім',
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

type ViolationKind = Exclude<ViolationEnum, ViolationEnum.NONE>

const violationLabelsByLocale: Record<Locale, Record<ViolationEnum, string>> = {
	ru: {
		NONE: 'Нет нарушений',
		REMARK: 'Замечание',
		REBUKE: 'Выговор',
		SEVERE_REPRIMAND: 'Строгий выговор',
	},
	kk: {
		NONE: 'Бұзушылық жоқ',
		REMARK: 'Ескерту',
		REBUKE: 'Сөгіс',
		SEVERE_REPRIMAND: 'Қатаң сөгіс',
	},
}

const violationPenaltyPoints: Record<ViolationKind, number> = {
	REMARK: 10,
	REBUKE: 20,
	SEVERE_REPRIMAND: 30,
}

export const getViolationLabels = (locale: Locale = 'ru'): Record<ViolationEnum, string> => {
	return violationLabelsByLocale[locale] || violationLabelsByLocale.ru
}

export const normalizeViolation = (violation: ViolationEnum, locale: Locale = 'ru'): string => {
	return getViolationLabels(locale)[violation] || getViolationLabels(locale).NONE
}

export const getNextViolationStatus = (current: ViolationEnum = ViolationEnum.NONE): ViolationEnum => {
	switch (current) {
		case ViolationEnum.NONE:
			return ViolationEnum.REMARK
		case ViolationEnum.REMARK:
			return ViolationEnum.REBUKE
		case ViolationEnum.REBUKE:
			return ViolationEnum.SEVERE_REPRIMAND
		case ViolationEnum.SEVERE_REPRIMAND:
		default:
			return ViolationEnum.SEVERE_REPRIMAND
	}
}

export const getViolationPenaltyPoints = (violation: ViolationKind): number => {
	return violationPenaltyPoints[violation]
}

export const getViolationIssueOptions = (locale: Locale = 'ru') => {
	const labels = getViolationLabels(locale)
	const options: ViolationKind[] = [ViolationEnum.REMARK, ViolationEnum.REBUKE, ViolationEnum.SEVERE_REPRIMAND]

	return options.map((type) => ({
		type,
		label: labels[type],
		points: getViolationPenaltyPoints(type),
	}))
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
