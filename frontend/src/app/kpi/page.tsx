'use client'

import { Loader, PageTitle } from '@components'
import { hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { UserRoleEnum } from '@types'

import { CreateCard, HeroCard } from './components'

const Page = () => {
	const { user, authLoading } = useAuthStore()
	// query
	const { data = [], isLoading } = useQuery({ ...services.award.getAllTypesOptions(), enabled: true })

	if (!user || authLoading || isLoading) return <Loader type='data' />

	const isMethodist = hasRole(user.role, UserRoleEnum.METHODIST, false)

	console.log(data)

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle description='Рейтинг преподавателей'>KPI</PageTitle>

			<div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.7fr)] mt-4'>
				<HeroCard className={isMethodist ? 'col-span-2' : 'col-span-1'} />
				{!isMethodist && <CreateCard />}
			</div>

			{/* <AwardsCard
			 	awards={data}
			 /> */}
		</section>
	)
}

export default Page
