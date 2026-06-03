'use client'

import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, Pagination, SectionTitle, UserCard } from '@components'
import { getUILocaleSection, hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum, type StatusEnum } from '@types'

import { AwardFilterCard } from '../components'
import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

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

	const { user, authLoading } = useAuthStore()
	const isTeacher = !!user && hasRole(user.role, RoleEnum.TEACHER, true)

	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: page,
			pageSize,
			status: status as StatusEnum[],
			categoryId,
			sort,
			teacher: user?.keycloakId,
		}),
		enabled: !!user && isTeacher,
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

	if (authLoading || !user) return <Loader type='data' />
	if (!isTeacher) return notFound()

	return (
		<section className='mx-auto w-full max-w-6xl space-y-6 p-4'>
			<SectionTitle description={t.profileDescription} title={t.profileTitle} />

			<UserCard showTotalPoints showViolation={false} user={user} />

			<div className='space-y-4'>
				<AwardFilterCard compact className='mb-4' />

				<AwardsCard
					awards={awardsData?.data || []}
					currentPage={awardsData?.meta.currentPage || 1}
					description={t.listDescription}
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
