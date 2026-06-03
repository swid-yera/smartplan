'use client'

import { notFound, useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle, Pagination, UserCard } from '@components'
import { getUILocaleSection, hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum, type StatusEnum } from '@types'

import { AwardFilterCard } from '../../components'
import localeDictionary from './locale.json'

const Page = () => {
	const params = useParams<{ id: string }>()
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { user, authLoading } = useAuthStore()

	const isKpiViewer = !!user && hasRole(user.role, RoleEnum.METHODIST, true)
	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10
	const statusParam = searchParams.get('status') ?? ''
	const categoryIdParam = searchParams.get('categoryId') ?? ''
	const sortParam = searchParams.get('sort')

	const status = statusParam ? statusParam.split(',') : undefined
	const sort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : 'desc'
	const categoryId = categoryIdParam
		? categoryIdParam
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean)
		: undefined

	const {
		data: userData,
		isLoading: userLoading,
		isError,
	} = useQuery({
		...services.user.getByIdOptions(params.id),
		enabled: !!params.id && isKpiViewer,
	})

	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: page,
			pageSize,
			status: status as StatusEnum[],
			categoryId,
			sort,
			teacher: params.id,
		}),
		enabled: !!params.id && !!userData && !isError,
	})

	const setCurrentPage = (newPage: number) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('page', String(newPage))
		router.push(`${pathname}?${paramsUrl.toString()}`)
	}

	const setPageSize = (newSize: number) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('pageSize', String(newSize))
		paramsUrl.set('page', '1')
		router.push(`${pathname}?${paramsUrl.toString()}`)
	}

	if (authLoading || !user) return <Loader type='data' />
	if (!isKpiViewer) return notFound()
	if (userLoading) return <Loader type='data' />
	console.log(userData)
	if (isError || !userData) return notFound()

	return (
		<section className='mx-auto w-full max-w-6xl space-y-6 p-4'>
			<PageTitle backHref='/kpi/all' backLabel={t.back} description={t.profileDescription}>
				{t.profileTitle}
			</PageTitle>

			<UserCard showTotalPoints showViolation={false} user={userData} />

			<div className='space-y-4'>
				<AwardFilterCard compact className='mb-4' />

				<AwardsCard
					awards={awardsData?.data || []}
					currentPage={awardsData?.meta.currentPage || 1}
					isLoading={isAwardsLoading}
					showPointsColumn={false}
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
			</div>
		</section>
	)
}

export default Page
