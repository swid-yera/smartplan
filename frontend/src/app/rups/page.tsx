'use client'

import type { NextPage } from 'next'
import { notFound } from 'next/navigation'

import { Loader, PageTitle, RupsCard } from '@components'
import { hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { UserRoleEnum } from '@types'

import { NewCard, RupsFilterCard } from './components/'

const Page: NextPage = () => {
	const { authLoading, user } = useAuthStore()

	// queries
	const { data: rupsData, isLoading } = useQuery({
		...services.rup.getAllOptions({ currentPage: 1, pageSize: 10 }),
		enabled: !authLoading && !!user,
	})

	const setCurrentPage = (newPage: number) => {
		console.log(newPage)
	}

	if (authLoading) return <Loader />
	if (!user) return notFound()

	const isTeacher = hasRole(user.role, UserRoleEnum.TEACHER, false)
	const canCreate = hasRole(user.role, UserRoleEnum.TEACHER, true)

	return (
		<div className='space-y-6 p-6'>
			<PageTitle
				description={
					canCreate
						? 'Здесь вы можете создавать и управлять своими рабочими учебными планами.'
						: 'Реестр всех рабочих учебных планов для проверки и утверждения.'
				}
			>
				{isTeacher ? 'Мои рабочие учебные планы' : 'Все рабочие учебные планы'}
			</PageTitle>

			<div className='grid gap-6 lg:grid-cols-5'>
				<div className={canCreate ? 'lg:col-span-3' : 'lg:col-span-5'}>
					<RupsFilterCard className='h-full' role={'METHODIST'} />
				</div>

				{canCreate && (
					<div className='lg:col-span-2'>
						<NewCard className='h-full justify-between' />
					</div>
				)}
			</div>

			<RupsCard
				currentPage={rupsData?.meta.currentPage || 1}
				isLoading={isLoading}
				rups={rupsData?.data || []}
				title={isTeacher ? 'Мои рабочие учебные планы' : 'Все рабочие учебные планы'}
				totalPages={rupsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
			/>
		</div>
	)
}

export default Page
