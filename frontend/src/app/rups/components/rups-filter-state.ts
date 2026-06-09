export type RupSortOrder = 'asc' | 'desc'

export type RupFilterState = {
	search: string
	statuses: string[]
	sort: RupSortOrder
}

export const RUP_FILTER_STORAGE_KEY = 'eduplan:rups-my-filters'
export const DEFAULT_RUP_SORT: RupSortOrder = 'desc'

const normalizeValues = (values: string[]) =>
	values
		.map((value) => value.trim())
		.filter(Boolean)
		.filter((value, index, array) => array.indexOf(value) === index)

export const getRupFilterStateFromSearchParams = (searchParams: URLSearchParams): RupFilterState => {
	const search = searchParams.get('q') ?? ''
	const statusParam = searchParams.get('status') ?? ''
	const sortParam = searchParams.get('sort')

	return {
		search: search.trim(),
		statuses: statusParam ? normalizeValues(statusParam.split(',')) : [],
		sort: sortParam === 'asc' || sortParam === 'desc' ? sortParam : DEFAULT_RUP_SORT,
	}
}

export const hasExplicitRupFilterParams = (searchParams: URLSearchParams) =>
	searchParams.has('q') || searchParams.has('status') || searchParams.has('sort')

export const buildRupFilterSearchParams = (
	baseParams: URLSearchParams,
	state: RupFilterState,
	options?: { resetPage?: boolean },
) => {
	const params = new URLSearchParams(baseParams.toString())

	params.delete('q')
	params.delete('status')
	params.delete('sort')

	if (state.search.trim()) {
		params.set('q', state.search.trim())
	}
	if (state.statuses.length > 0) {
		params.set('status', normalizeValues(state.statuses).join(','))
	}
	params.set('sort', state.sort)

	if (options?.resetPage !== false) {
		params.set('page', '1')
	}

	return params
}

export const readPersistedRupFilterState = (): RupFilterState | null => {
	if (typeof window === 'undefined') return null

	const raw = window.localStorage.getItem(RUP_FILTER_STORAGE_KEY)

	if (!raw) return null

	try {
		const parsed = JSON.parse(raw) as Partial<RupFilterState>

		return {
			search: typeof parsed.search === 'string' ? parsed.search.trim() : '',
			statuses: Array.isArray(parsed.statuses) ? normalizeValues(parsed.statuses) : [],
			sort: parsed.sort === 'asc' || parsed.sort === 'desc' ? parsed.sort : DEFAULT_RUP_SORT,
		}
	} catch {
		return null
	}
}

export const persistRupFilterState = (state: RupFilterState) => {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(
		RUP_FILTER_STORAGE_KEY,
		JSON.stringify({
			search: state.search.trim(),
			statuses: normalizeValues(state.statuses),
			sort: state.sort,
		}),
	)
}

export const clearPersistedRupFilterState = () => {
	if (typeof window === 'undefined') return

	window.localStorage.removeItem(RUP_FILTER_STORAGE_KEY)
}
