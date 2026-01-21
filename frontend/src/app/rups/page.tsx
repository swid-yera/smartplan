'use client'

import { useState } from 'react'

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

	// states
	const [currentPage, setCurrentPage] = useState(1)

	// queries
	const { data: allRups = [], isLoading } = useQuery({
		...services.rup.getAllOptions(),
		enabled: !authLoading && !!user,
	})

	if (isLoading || authLoading) return <Loader />
	if (!user) return notFound()

	const isTeacher = hasRole(user.role, UserRoleEnum.TEACHER, false)
	const canCreate = hasRole(user.role, UserRoleEnum.TEACHER, true)

	const totalPages = Math.ceil(allRups.length / 10)
	const paginatedRups = allRups.slice((currentPage - 1) * 10, currentPage * 10)

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
				currentPage={currentPage}
				rups={paginatedRups}
				title={isTeacher ? 'Мои рабочие учебные планы' : 'Все рабочие учебные планы'}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
			/>
		</div>
	)
}

export default Page
