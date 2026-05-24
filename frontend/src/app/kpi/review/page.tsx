'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle, Pagination } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { StatusEnum } from '@types'
import localeDictionary from './locale.json'

const MethodistAwardsPage = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
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
			status: [StatusEnum.IN_REVIEW],
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

	const handleViewAll = () => {
		router.push(`${pathname}?page=1`) // Redirect to the first page of all awards
	}

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<Button asChild variant='default' onClick={handleViewAll}>
				<Link href='/kpi/all'>{t.viewAll}</Link>
			</Button>

			<AwardsCard
				awards={awardsData?.data || []}
				currentPage={awardsData?.meta.currentPage || 1}
				isLoading={isAwardsLoading}
				title={t.listTitle}
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
