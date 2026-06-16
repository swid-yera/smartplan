import type { Locale } from '@types'
import { isToday, parseISO } from 'date-fns'

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
export const formatHours = (count: number, locale: Locale = 'ru'): string => {
	if (locale === 'kk') {
		return `${count} сағат`
	}

	const word = pluralize(count, 'час', 'часа', 'часов')

	return `${count} ${word}`
}

// sting to date
export const parseToDate = (date: string): Date => {
	try {
		return parseISO(date)
	} catch (error) {
		console.error(error)

		return new Date()
	}
}

// is current day
export const isCurrentDay = (date: Date | string): boolean => {
	if (typeof date === 'string') {
		date = parseToDate(date)
	}

	return isToday(date)
}

export const toDateOnlyIso = (date: Date | undefined): string => {
	if (!date) return ''

	const normalizedDate = new Date(date)

	normalizedDate.setHours(0, 0, 0, 0)

	return normalizedDate.toISOString()
}

export const formatDateOnly = (value: string, locale: Locale = 'ru'): string => {
	const [year, month, day] = value.split('-').map(Number)
	if (!year || !month || !day) return value

	const date = new Date(year, month - 1, day)
	const intlLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'

	return new Intl.DateTimeFormat(intlLocale, {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(date)
}
