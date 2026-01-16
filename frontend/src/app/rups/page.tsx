'use client'

import { useState } from 'react'

import type { NextPage } from 'next'
import { notFound } from 'next/navigation'

import { Loader } from '@components'
import { hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { UserRoleEnum } from '@types'

import { FilterCard } from './components/filter-card'
import { NewCard } from './components/new-card'
import { RupsCard } from './components/rups-card'

const ITEMS_PER_PAGE = 10

const Page: NextPage = () => {
	const { authLoading, user } = useAuthStore()
	const [currentPage, setCurrentPage] = useState(1)
	// const searchParams = useSearchParams()

	const { data: allRups = [], isLoading } = useQuery({
		...services.rup.getAllOptions(),
		enabled: !authLoading && !!user,
	})

	if (isLoading || authLoading) return <Loader />
	if (!user) return notFound()

	const isTeacher = hasRole(user.role, UserRoleEnum.TEACHER)

	const totalPages = Math.ceil(allRups.length / ITEMS_PER_PAGE)
	const paginatedRups = allRups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

	return (
		<div className='space-y-6 p-6'>
			<div className='space-y-1'>
				<h1 className='text-3xl font-bold tracking-tight'>
					{isTeacher ? 'Мои рабочие учебные планы' : 'Все рабочие учебные планы'}
				</h1>
				<p className='text-muted-foreground'>
					{isTeacher
						? 'Здесь вы можете создавать и управлять своими рабочими учебными планами.'
						: 'Реестр всех рабочих учебных планов для проверки и утверждения.'}
				</p>
			</div>

			<div className='grid gap-6 lg:grid-cols-4'>
				{isTeacher && (
					<div className='lg:col-span-1'>
						<NewCard className='h-full justify-between' />
					</div>
				)}
				<div className={isTeacher ? 'lg:col-span-3' : 'lg:col-span-4'}>
					<FilterCard className='h-full' role={'METHODIST'} />
				</div>
			</div>

			<RupsCard
				currentPage={currentPage}
				rups={paginatedRups}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
			/>
		</div>
	)
}

export default Page
