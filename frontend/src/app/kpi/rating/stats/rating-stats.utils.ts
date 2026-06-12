import { type IUser, type Locale } from '@types'

export const RATING_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
] as const

export const normalizeTeacherName = (teacher: IUser) =>
	`${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim() || teacher.username || '—'

export const compareTeacherNames = (left: IUser, right: IUser, locale: Locale) => {
	const leftLastName = (left.lastName ?? '').trim()
	const rightLastName = (right.lastName ?? '').trim()
	const lastNameCompare = leftLastName.localeCompare(rightLastName, locale, { sensitivity: 'base' })

	if (lastNameCompare !== 0) return lastNameCompare

	const leftFirstName = (left.firstName ?? '').trim()
	const rightFirstName = (right.firstName ?? '').trim()
	const firstNameCompare = leftFirstName.localeCompare(rightFirstName, locale, { sensitivity: 'base' })

	if (firstNameCompare !== 0) return firstNameCompare

	const leftUsername = (left.username ?? '').trim()
	const rightUsername = (right.username ?? '').trim()
	const usernameCompare = leftUsername.localeCompare(rightUsername, locale, { sensitivity: 'base' })

	if (usernameCompare !== 0) return usernameCompare

	return (left.keycloakId ?? '').localeCompare(right.keycloakId ?? '', locale)
}
