'use client'

import type { NextPage } from 'next'
import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, RupsCard } from '@components'
import { hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { StatusEnum, UserRoleEnum } from '@types'

import { NewCard, RupsFilterCard } from './components/'

const Page: NextPage = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const { authLoading, user } = useAuthStore()

	const page = Number(searchParams.get('page')) || 1
	const q = searchParams.get('q') || ''
	const status = (searchParams.get('status') || '').split(',') as StatusEnum[]
	const teacherId = hasRole(user?.role || UserRoleEnum.TEACHER, UserRoleEnum.TEACHER, false) ? user?.keycloakId : ''

	// queries
	const { data: rupsData, isLoading } = useQuery({
		...services.rup.getAllOptions({
			currentPage: page,
			pageSize: 100,
			search: q,
			status,
			teacher: teacherId,
		}),
		enabled: !authLoading && !!user,
	})

	const setCurrentPage = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('page', String(newPage))
		router.push(`${pathname}?${params.toString()}`)
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
					<RupsFilterCard className='h-full' />
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
