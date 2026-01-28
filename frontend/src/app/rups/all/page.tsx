'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, Pagination, RupsCard } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { StatusEnum } from '@types'

import { RupsFilterCard } from '../components'

const Page = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const q = searchParams.get('q') || ''
	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10
	const statusParam = searchParams.get('status') ?? '' // "PENDING,APPROVED"

	const status = statusParam ? statusParam.split(',') : undefined

	const { user, authLoading } = useAuthStore()

	const { data: rupsData, isLoading: isRupsLoading } = useQuery({
		...services.rup.getAllOptions({
			currentPage: page,
			pageSize: pageSize,
			search: q as string,
			status: status as StatusEnum[],
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
		params.set('page', '1')
		router.push(`${pathname}?${params.toString()}`)
	}

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle description='Все созданные рабочие учебные программы'>Все РУП</PageTitle>

			<RupsFilterCard />

			<RupsCard
				currentPage={rupsData?.meta.currentPage || 1}
				isLoading={isRupsLoading}
				rups={rupsData?.data || []}
				title='Список всех созданных РУП'
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

export default Page
