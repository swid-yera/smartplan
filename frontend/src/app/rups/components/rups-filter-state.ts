export type RupSortOrder = 'asc' | 'desc'

export type RupFilterState = {
	search: string
	statuses: string[]
	sort: RupSortOrder
}

export const RUP_FILTER_STORAGE_KEY = 'eduplan:rups-my-filters'
export const DEFAULT_RUP_SORT: RupSortOrder = 'desc'

type RupFilterParamNames = {
	search: string
	statuses: string
	sort: string
	page: string
}

const getRupFilterParamNames = (paramPrefix = ''): RupFilterParamNames => {
	if (!paramPrefix) {
		return {
			search: 'q',
			statuses: 'status',
			sort: 'sort',
			page: 'page',
		}
	}

	return {
		search: `${paramPrefix}Q`,
		statuses: `${paramPrefix}Status`,
		sort: `${paramPrefix}Sort`,
		page: `${paramPrefix}Page`,
	}
}

const normalizeValues = (values: string[]) =>
	values
		.map((value) => value.trim())
		.filter(Boolean)
		.filter((value, index, array) => array.indexOf(value) === index)

export const getRupFilterStateFromSearchParams = (
	searchParams: URLSearchParams,
	options?: { paramPrefix?: string },
): RupFilterState => {
	const { search: searchKey, statuses: statusKey, sort: sortKey } = getRupFilterParamNames(options?.paramPrefix)
	const search = searchParams.get(searchKey) ?? ''
	const statusParam = searchParams.get(statusKey) ?? ''
	const sortParam = searchParams.get(sortKey)

	return {
		search: search.trim(),
		statuses: statusParam ? normalizeValues(statusParam.split(',')) : [],
		sort: sortParam === 'asc' || sortParam === 'desc' ? sortParam : DEFAULT_RUP_SORT,
	}
}

export const hasExplicitRupFilterParams = (searchParams: URLSearchParams, options?: { paramPrefix?: string }) => {
	const { search: searchKey, statuses: statusKey, sort: sortKey } = getRupFilterParamNames(options?.paramPrefix)

	return searchParams.has(searchKey) || searchParams.has(statusKey) || searchParams.has(sortKey)
}

export const buildRupFilterSearchParams = (
	baseParams: URLSearchParams,
	state: RupFilterState,
	options?: { resetPage?: boolean; paramPrefix?: string },
) => {
	const params = new URLSearchParams(baseParams.toString())
	const {
		search: searchKey,
		statuses: statusKey,
		sort: sortKey,
		page: pageKey,
	} = getRupFilterParamNames(options?.paramPrefix)

	params.delete(searchKey)
	params.delete(statusKey)
	params.delete(sortKey)

	if (state.search.trim()) {
		params.set(searchKey, state.search.trim())
	}
	if (state.statuses.length > 0) {
		params.set(statusKey, normalizeValues(state.statuses).join(','))
	}
	params.set(sortKey, state.sort)

	if (options?.resetPage !== false) {
		params.set(pageKey, '1')
	}

	return params
}

export const readPersistedRupFilterState = (storageKey = RUP_FILTER_STORAGE_KEY): RupFilterState | null => {
	if (typeof window === 'undefined') return null

	const raw = window.localStorage.getItem(storageKey)

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

export const persistRupFilterState = (state: RupFilterState, storageKey = RUP_FILTER_STORAGE_KEY) => {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(
		storageKey,
		JSON.stringify({
			search: state.search.trim(),
			statuses: normalizeValues(state.statuses),
			sort: state.sort,
		}),
	)
}

export const clearPersistedRupFilterState = (storageKey = RUP_FILTER_STORAGE_KEY) => {
	if (typeof window === 'undefined') return

	window.localStorage.removeItem(storageKey)
}
