'use client'

import { useEffect } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, Pagination, RupsCard, withRole } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore } from '@store'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { RoleEnum, type StatusEnum } from '@types'

import { KpiUserSearchCard } from '../../kpi/components'
import { RupsFilterCard } from '../components'
import {
	buildRupFilterSearchParams,
	getRupFilterStateFromSearchParams,
	hasExplicitRupFilterParams,
	persistRupFilterState,
	readPersistedRupFilterState,
} from '../components/rups-filter-state'
import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const searchParamsString = searchParams.toString()
	const { user, authLoading } = useAuthStore()

	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10
	const filterState = getRupFilterStateFromSearchParams(new URLSearchParams(searchParamsString))
	const q = filterState.search
	const status = filterState.statuses as StatusEnum[]
	const sort = filterState.sort

	useEffect(() => {
		const currentParams = new URLSearchParams(searchParamsString)
		const currentFilterState = getRupFilterStateFromSearchParams(currentParams)

		if (hasExplicitRupFilterParams(currentParams)) {
			persistRupFilterState(currentFilterState)

			return
		}

		const persistedState = readPersistedRupFilterState()

		if (!persistedState) return

		const nextParams = buildRupFilterSearchParams(currentParams, persistedState, { resetPage: true })
		const nextQuery = nextParams.toString()

		if (nextQuery === currentParams.toString()) return

		router.replace(`${pathname}?${nextQuery}`, { scroll: false })
	}, [pathname, router, searchParamsString])

	const { data: rupsData, isLoading: isRupsLoading } = useQuery({
		...services.rup.getAllOptions({
			currentPage: page,
			pageSize: pageSize,
			search: q,
			sort,
			status,
		}),
		placeholderData: keepPreviousData,
		enabled: !!user,
	})

	const setCurrentPage = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('page', String(newPage))
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}

	const setPageSize = (newSize: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('pageSize', String(newSize))
		params.set('page', '1')
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<KpiUserSearchCard profileTab='rups' />

			<RupsFilterCard className='mb-4' />

			<RupsCard
				currentPage={rupsData?.meta.currentPage || 1}
				isLoading={isRupsLoading}
				rups={rupsData?.data || []}
				title={t.listTitle}
				totalPages={rupsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
			/>

			<Pagination
				page={rupsData?.meta.currentPage || 1}
				pageSize={rupsData?.meta.pageSize || 10}
				pageSizeOptions={[10, 20, 50]}
				totalPages={rupsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
				onPageSizeChange={setPageSize}
			/>
		</section>
	)
}

export default withRole(Page, [RoleEnum.METHODIST])
