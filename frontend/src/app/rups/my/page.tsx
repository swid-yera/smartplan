'use client'

import { useEffect } from 'react'

import type { NextPage } from 'next'
import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, PageTitleActions, Pagination, RupsCard, withNavAccess } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore, usePaginationSettingsStore } from '@store'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { StatusEnum } from '@types'
import { Plus, Upload } from 'lucide-react'

import { RupsFilterCard } from '../components'
import {
	buildRupFilterSearchParams,
	getRupFilterStateFromSearchParams,
	hasExplicitRupFilterParams,
	persistRupFilterState,
	readPersistedRupFilterState,
} from '../components/rups-filter-state'
import localeDictionary from '../locale.json'

const Page: NextPage = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const searchParamsString = searchParams.toString()
	const { authLoading, user } = useAuthStore()

	const page = Number(searchParams.get('page')) || 1
	const storedPageSize = usePaginationSettingsStore((state) => state.pageSize)
	const setStoredPageSize = usePaginationSettingsStore((state) => state.setPageSize)
	const pageSize = Number(searchParams.get('pageSize')) || storedPageSize
	const filterState = getRupFilterStateFromSearchParams(new URLSearchParams(searchParamsString))
	const q = filterState.search
	const status = filterState.statuses as StatusEnum[]
	const groupIds = filterState.groupIds
	const studyYear = filterState.studyYear
	const sort = filterState.sort
	const teacherId = user?.keycloakId ?? ''

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

	// queries
	const { data: rupsData, isLoading } = useQuery({
		...services.rup.getAllOptions({
			currentPage: page,
			pageSize,
			search: q,
			groupIds,
			studyYear,
			status,
			sort,
			teacher: teacherId,
		}),
		placeholderData: keepPreviousData,
		enabled: !authLoading && !!user,
	})

	const setCurrentPage = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('page', String(newPage))
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}

	const setPageSize = (newSize: number) => {
		setStoredPageSize(newSize)

		const params = new URLSearchParams(searchParams.toString())

		params.set('pageSize', String(newSize))
		params.set('page', '1')
		router.push(`${pathname}?${params.toString()}`, { scroll: false })
	}

	if (authLoading) return <Loader />
	if (!user) return notFound()

	return (
		<div className='space-y-6 p-6'>
			<PageTitle
				actions={
					<PageTitleActions
						actions={[
							{
								id: 'create',
								label: t.newRupButton,
								icon: Plus,
								href: '/rups/create',
								priority: 'primary',
							},
							{
								id: 'import',
								label: t.importRupButton,
								icon: Upload,
								href: '/rups/import',
							},
						]}
						moreLabel={t.moreActions}
					/>
				}
				description={t.teacherDescription}
			>
				{t.teacherTitle}
			</PageTitle>

			<RupsFilterCard />

			<RupsCard
				currentPage={rupsData?.meta.currentPage || 1}
				isLoading={!rupsData && isLoading}
				rups={rupsData?.data || []}
				showGroupsColumn
				title={t.listTeacher}
				totalPages={1}
				onPageChange={setCurrentPage}
			/>

			<Pagination
				page={rupsData?.meta.currentPage || 1}
				pageSize={rupsData?.meta.pageSize || pageSize}
				pageSizeOptions={[10, 20, 50]}
				totalCount={rupsData?.meta.total || 0}
				totalPages={rupsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
				onPageSizeChange={setPageSize}
			/>
		</div>
	)
}

export default withNavAccess(Page)
