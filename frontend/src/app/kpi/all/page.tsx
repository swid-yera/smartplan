'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle, Pagination } from '@components'
import { getUILocaleSection, hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum, type StatusEnum } from '@types'

import { AwardFilterCard, KpiUserSearchCard } from '../components'
import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	// Параметры из URL
	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10
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
	const canSearchUsers = !!user && hasRole(user.role, RoleEnum.METHODIST, true)

	// query
	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: page,
			pageSize,
			status: status as StatusEnum[],
			categoryId,
			sort,
		}),
		enabled: !!user,
	})

	const setCurrentPage = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('page', String(newPage))
		router.push(`${pathname}?${params.toString()}`)
	}

	const setPageSize = (newSize: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('pageSize', String(newSize))
		params.set('page', '1') // при смене размера страницы возвращаем на первую страницу
		router.push(`${pathname}?${params.toString()}`)
	}

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			{canSearchUsers && <KpiUserSearchCard />}

			{/* фильтр и поиск */}
			<AwardFilterCard compact className='mb-4' />

			{/* список наград */}
			<AwardsCard
				awards={awardsData?.data || []}
				currentPage={awardsData?.meta.currentPage || 1}
				isLoading={isAwardsLoading}
				title={t.listTitle}
				totalPages={awardsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
			/>

			{/* пагинация */}
			<Pagination
				page={awardsData?.meta.currentPage || 1}
				pageSize={awardsData?.meta.pageSize || 10}
				pageSizeOptions={[10, 20, 50]}
				totalPages={awardsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
				onPageSizeChange={setPageSize}
			/>
		</section>
	)
}

export default Page
