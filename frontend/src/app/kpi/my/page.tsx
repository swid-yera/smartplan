'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle, Pagination } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'

const MethodistAwardsPage = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10

	const { user, authLoading } = useAuthStore()

	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: page,
			pageSize: pageSize,
			teacher: user?.keycloakId,
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
			<PageTitle description='Мои достижения'>Мои опубликованные достижения</PageTitle>

			<AwardsCard
				awards={awardsData?.data || []}
				currentPage={awardsData?.meta.currentPage || 1}
				isLoading={isAwardsLoading}
				title='Список ваших наград'
				totalPages={awardsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
			/>

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

export default MethodistAwardsPage
