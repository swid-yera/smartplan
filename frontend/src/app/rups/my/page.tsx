'use client'

import { useEffect } from 'react'

import type { NextPage } from 'next'
import Link from 'next/link'
import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, RupsCard, withPermission } from '@components'
import { getUILocaleSection, hasPermission } from '@helpers'
import { services } from '@services'
import { Button } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum, StatusEnum } from '@types'
import { Plus } from 'lucide-react'

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
	const filterState = getRupFilterStateFromSearchParams(new URLSearchParams(searchParamsString))
	const q = filterState.search
	const status = filterState.statuses as StatusEnum[]
	const sort = filterState.sort
	const canManageRups = hasPermission(user, PermissionCodeEnum.RUP_MANAGE)
	const canViewRups = hasPermission(user, PermissionCodeEnum.RUP_VIEW)
	const teacherId = canViewRups && !canManageRups ? user?.keycloakId : ''

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
			pageSize: 100,
			search: q,
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

	if (authLoading) return <Loader />
	if (!user) return notFound()

	return (
		<div className='space-y-6 p-6'>
			<PageTitle
				actions={
					canManageRups ? (
						<Button asChild>
							<Link href='/rups/create'>
								<Plus className='mr-2 h-4 w-4' />
								{t.newRupButton}
							</Link>
						</Button>
					) : undefined
				}
				description={canManageRups ? t.methodistDescription : t.teacherDescription}
			>
				{canManageRups ? t.methodistTitle : t.teacherTitle}
			</PageTitle>

			<RupsFilterCard />

			<RupsCard
				currentPage={rupsData?.meta.currentPage || 1}
				isLoading={!rupsData && isLoading}
				rups={rupsData?.data || []}
				title={canManageRups ? t.listMethodist : t.listTeacher}
				totalPages={rupsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
			/>
		</div>
	)
}

export default withPermission(Page, [PermissionCodeEnum.RUP_VIEW], true)
