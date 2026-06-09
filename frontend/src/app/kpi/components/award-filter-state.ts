export type AwardSortOrder = 'asc' | 'desc'

export type AwardFilterState = {
	statuses: string[]
	categoryIds: string[]
	sort: AwardSortOrder
}

export const AWARD_FILTER_STORAGE_KEY = 'eduplan:kpi-all-award-filters'
export const DEFAULT_AWARD_SORT: AwardSortOrder = 'desc'

const normalizeValues = (values: string[]) =>
	values
		.map((value) => value.trim())
		.filter(Boolean)
		.filter((value, index, array) => array.indexOf(value) === index)

export const getAwardFilterStateFromSearchParams = (searchParams: URLSearchParams): AwardFilterState => {
	const statusParam = searchParams.get('status') ?? ''
	const categoryIdParam = searchParams.get('categoryId') ?? ''
	const sortParam = searchParams.get('sort')

	return {
		statuses: statusParam ? normalizeValues(statusParam.split(',')) : [],
		categoryIds: categoryIdParam ? normalizeValues(categoryIdParam.split(',')) : [],
		sort: sortParam === 'asc' || sortParam === 'desc' ? sortParam : DEFAULT_AWARD_SORT,
	}
}

export const hasExplicitAwardFilterParams = (searchParams: URLSearchParams) =>
	searchParams.has('status') || searchParams.has('categoryId') || searchParams.has('sort')

export const buildAwardFilterSearchParams = (
	baseParams: URLSearchParams,
	state: AwardFilterState,
	options?: { resetPage?: boolean },
) => {
	const params = new URLSearchParams(baseParams.toString())

	params.delete('status')
	params.delete('categoryId')
	params.delete('sort')

	if (state.statuses.length > 0) {
		params.set('status', normalizeValues(state.statuses).join(','))
	}
	if (state.categoryIds.length > 0) {
		params.set('categoryId', normalizeValues(state.categoryIds).join(','))
	}
	params.set('sort', state.sort)

	if (options?.resetPage !== false) {
		params.set('page', '1')
	}

	return params
}

export const readPersistedAwardFilterState = (): AwardFilterState | null => {
	if (typeof window === 'undefined') return null

	const raw = window.localStorage.getItem(AWARD_FILTER_STORAGE_KEY)

	if (!raw) return null

	try {
		const parsed = JSON.parse(raw) as Partial<AwardFilterState>

		return {
			statuses: Array.isArray(parsed.statuses) ? normalizeValues(parsed.statuses) : [],
			categoryIds: Array.isArray(parsed.categoryIds) ? normalizeValues(parsed.categoryIds) : [],
			sort: parsed.sort === 'asc' || parsed.sort === 'desc' ? parsed.sort : DEFAULT_AWARD_SORT,
		}
	} catch {
		return null
	}
}

export const persistAwardFilterState = (state: AwardFilterState) => {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(
		AWARD_FILTER_STORAGE_KEY,
		JSON.stringify({
			statuses: normalizeValues(state.statuses),
			categoryIds: normalizeValues(state.categoryIds),
			sort: state.sort,
		}),
	)
}

export const clearPersistedAwardFilterState = () => {
	if (typeof window === 'undefined') return

	window.localStorage.removeItem(AWARD_FILTER_STORAGE_KEY)
}
