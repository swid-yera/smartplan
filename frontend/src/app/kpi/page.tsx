'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle } from '@components'
import { hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { UserRoleEnum } from '@types'

import { CreateCard, HeroCard } from './components'

const Page = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const page = Number(searchParams.get('page')) || 1

	// store
	const { user, authLoading } = useAuthStore()
	// query
	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({ currentPage: page, pageSize: 10 }),
		enabled: !!user,
	})

	const setCurrentPage = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('page', String(newPage))
		router.push(`${pathname}?${params.toString()}`)
	}

	if (!user || authLoading) return <Loader type='data' />

	const isMethodist = hasRole(user.role, UserRoleEnum.METHODIST, false)

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle description='Рейтинг преподавателей'>KPI</PageTitle>

			<div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.7fr)] mt-4'>
				<HeroCard className={isMethodist ? 'col-span-2' : 'col-span-1'} />
				{!isMethodist && <CreateCard />}
			</div>

			<AwardsCard
				awards={awardsData?.data || []}
				currentPage={awardsData?.meta.currentPage || 1}
				isLoading={isAwardsLoading}
				title='Список достижений'
				totalPages={awardsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
			/>
		</section>
	)
}

export default Page
