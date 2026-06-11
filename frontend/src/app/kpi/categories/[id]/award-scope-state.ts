'use client'

import { useEffect, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type CategoryAwardsScope = 'own' | 'all'

const CATEGORY_AWARDS_SCOPE_STORAGE_KEY = 'eduplan:kpi-category-awards-scope'

const isCategoryAwardsScope = (value: string | null): value is CategoryAwardsScope => value === 'own' || value === 'all'

const readPersistedCategoryAwardsScope = (): CategoryAwardsScope | null => {
	if (typeof window === 'undefined') return null

	const raw = window.localStorage.getItem(CATEGORY_AWARDS_SCOPE_STORAGE_KEY)

	return isCategoryAwardsScope(raw) ? raw : null
}

const persistCategoryAwardsScope = (scope: CategoryAwardsScope) => {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(CATEGORY_AWARDS_SCOPE_STORAGE_KEY, scope)
}

interface UseCategoryAwardsScopeArgs {
	canFullAwards: boolean
	canManageOnlyAwards: boolean
}

export const useCategoryAwardsScope = ({ canFullAwards, canManageOnlyAwards }: UseCategoryAwardsScopeArgs) => {
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()
	const [scope, setScope] = useState<CategoryAwardsScope>('own')
	const [isReady, setIsReady] = useState(!canFullAwards || canManageOnlyAwards)
	const searchParamsString = searchParams.toString()

	useEffect(() => {
		if (!canFullAwards) {
			setScope('own')
			setIsReady(true)

			return
		}

		if (canManageOnlyAwards) {
			setScope('all')
			persistCategoryAwardsScope('all')
			setIsReady(true)

			return
		}

		const urlScope = searchParams.get('scope')
		const persistedScope = readPersistedCategoryAwardsScope()
		const nextScope = isCategoryAwardsScope(urlScope) ? urlScope : (persistedScope ?? 'own')

		setScope(nextScope)
		persistCategoryAwardsScope(nextScope)
		setIsReady(true)

		if (!isCategoryAwardsScope(urlScope) && persistedScope) {
			const params = new URLSearchParams(searchParamsString)

			params.set('scope', persistedScope)

			router.replace(`${pathname}?${params.toString()}`, { scroll: false })
		}
	}, [canFullAwards, canManageOnlyAwards, pathname, router, searchParams, searchParamsString])

	const setAwardsScope = (checked: boolean) => {
		if (!canFullAwards || canManageOnlyAwards) return

		const nextScope: CategoryAwardsScope = checked ? 'all' : 'own'

		setScope(nextScope)
		persistCategoryAwardsScope(nextScope)

		const params = new URLSearchParams(searchParams.toString())

		params.set('scope', nextScope)
		params.set('page', '1')
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}

	return {
		isReady,
		scope,
		setAwardsScope,
	}
}
