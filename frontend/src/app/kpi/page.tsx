'use client'

import { Loader, PageTitle } from '@components'
import { hasRole } from '@helpers'
import { useAuthStore } from '@store'
import { UserRoleEnum } from '@types'

import { CreateCard, HeroCard } from './components'

const Page = () => {
	const { user, authLoading } = useAuthStore()

	if (!user || authLoading) return <Loader type='data' />

	const isMethodist = hasRole(user.role, UserRoleEnum.METHODIST, false)

	return (
		<section className='p-4 w-full'>
			<PageTitle description='Рейтинг преподавателей'>KPI</PageTitle>

			<div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.7fr)] mt-4'>
				<HeroCard className={isMethodist ? 'col-span-2' : 'col-span-1'} />
				{!isMethodist && <CreateCard />}
			</div>
		</section>
	)
}

export default Page
