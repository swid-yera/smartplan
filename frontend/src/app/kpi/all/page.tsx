'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle, Pagination } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { StatusEnum } from '@types'

import { AwardFilterCard } from '../components'

const Page = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	// Параметры из URL
	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10
	const statusParam = searchParams.get('status') ?? '' // "PENDING,APPROVED"

	const status = statusParam ? statusParam.split(',') : undefined

	// store
	const { user, authLoading } = useAuthStore()

	// query
	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: page,
			pageSize,
			status: status as StatusEnum[],
		}),
		enabled: !!user,
	})

	console.log(awardsData)

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
			<PageTitle description='KPI всех преподавателей'>KPI</PageTitle>

			{/* фильтр и поиск */}
			<AwardFilterCard className='mb-4' />

			{/* список наград */}
			<AwardsCard
				awards={awardsData?.data || []}
				currentPage={awardsData?.meta.currentPage || 1}
				isLoading={isAwardsLoading}
				title='Список достижений'
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
