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

// format value as dash
export const formatAsDash = (value: number | string = 0): string => {
	if (typeof value == 'number') {
		return value == 0 ? '—' : value.toString()
	}

	return !value ? '—' : value
}
