import type { IPagination } from '@types'

// format value as dash
export const formatAsDash = (value: number | string = 0): string => {
	if (typeof value == 'number') {
		return value == 0 ? '—' : value.toString()
	}

	return !value ? '—' : value
}

// generate empty meta pagination
export const generateEmptyMetaPagination = (): IPagination<''>['meta'] => {
	return { currentPage: 1, pages: 1, total: 0, pageSize: 10 }
}
