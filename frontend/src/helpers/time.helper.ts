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
