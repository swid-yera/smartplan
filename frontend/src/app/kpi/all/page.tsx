'use client'

import { useEffect } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle, Pagination, withPermission } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore, usePaginationSettingsStore } from '@store'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum, type StatusEnum } from '@types'

import { AwardFilterCard, KpiTeachersHubCard } from '../components'
import {
	buildAwardFilterSearchParams,
	getAwardFilterStateFromSearchParams,
	hasExplicitAwardFilterParams,
	persistAwardFilterState,
	readPersistedAwardFilterState,
} from '../components/award-filter-state'
import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const searchParamsString = searchParams.toString()

	// Параметры из URL
	const page = Number(searchParams.get('page')) || 1
	const storedPageSize = usePaginationSettingsStore((state) => state.pageSize)
	const setStoredPageSize = usePaginationSettingsStore((state) => state.setPageSize)
	const pageSize = Number(searchParams.get('pageSize')) || storedPageSize
	const statusParam = searchParams.get('status') ?? '' // "PENDING,APPROVED"
	const categoryIdParam = searchParams.get('categoryId') ?? '' // "id1,id2"
	const sortParam = searchParams.get('sort')

	const status = statusParam ? statusParam.split(',') : undefined
	const sort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : 'desc'
	const categoryId = categoryIdParam
		? categoryIdParam
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean)
		: undefined

	// store
	const { user, authLoading } = useAuthStore()

	// query
	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: page,
			pageSize,
			status: status as StatusEnum[],
			categoryId,
			sort,
		}),
		placeholderData: keepPreviousData,
		enabled: !!user,
	})

	useEffect(() => {
		const currentParams = new URLSearchParams(searchParamsString)

		if (hasExplicitAwardFilterParams(currentParams)) {
			const explicitState = getAwardFilterStateFromSearchParams(currentParams)

			persistAwardFilterState(explicitState)

			return
		}

		const persistedState = readPersistedAwardFilterState()

		if (!persistedState) return

		const nextParams = buildAwardFilterSearchParams(currentParams, persistedState, { resetPage: true })
		const nextQuery = nextParams.toString()

		if (nextQuery === currentParams.toString()) return

		router.replace(`${pathname}?${nextQuery}`, { scroll: false })
	}, [pathname, router, searchParamsString])

	const setCurrentPage = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('page', String(newPage))
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}

	const setPageSize = (newSize: number) => {
		setStoredPageSize(newSize)

		const params = new URLSearchParams(searchParams.toString())

		params.set('pageSize', String(newSize))
		params.set('page', '1') // при смене размера страницы возвращаем на первую страницу
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<KpiTeachersHubCard />

			{/* фильтр и поиск */}
			<AwardFilterCard compact className='mb-4' />
			{/* список наград */}
			<AwardsCard awards={awardsData?.data || []} isLoading={!awardsData && isAwardsLoading} title={t.listTitle} />

			{/* пагинация */}
			<Pagination
				page={page}
				pageSize={pageSize}
				pageSizeOptions={[10, 20, 50]}
				totalCount={awardsData?.meta.total || 0}
				totalPages={awardsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
				onPageSizeChange={setPageSize}
			/>
		</section>
	)
}

export default withPermission(Page, [PermissionCodeEnum.KPI_MANAGE])
