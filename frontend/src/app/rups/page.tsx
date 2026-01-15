'use client'

import { useEffect, useMemo, useState } from 'react'

import type { NextPage } from 'next'
import { useSearchParams } from 'next/navigation'

import { getAllRupModules } from '@services'
import { RoleSwitcher } from '@store'
import type { IRupModule } from '@types'

import useUserRoleStore from '../../store/user-role.store'
import { FilterCard } from './components/filter-card'
import { NewCard } from './components/new-card'
import { RupsCard } from './components/rups-card'

const ITEMS_PER_PAGE = 10

const Page: NextPage = () => {
	const [allRups, setAllRups] = useState<IRupModule[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const searchParams = useSearchParams()
	const { role, userId } = useUserRoleStore()

	useEffect(() => {
		const fetchRups = async () => {
			const data = await getAllRupModules()

			if (data) {
				setAllRups(data)
			}
		}

		fetchRups()
	}, [])

	// reset page to 1 when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [searchParams])

	const filteredRups = useMemo(() => {
		const q = searchParams.get('q')?.toLowerCase().trim() ?? ''
		const status = searchParams.get('status') ?? 'ALL'
		const year = searchParams.get('year') ?? 'ALL'
		const specialty = searchParams.get('specialty') ?? 'ALL'

		let rupsToFilter = allRups

		// Teachers only see their own modules
		if (role === 'TEACHER') {
			// NOTE: Assuming `IRupModule` has an `authorId` property.
			// This type and the data.property would need to be added to the
			rupsToFilter = allRups.filter(() => true) // show only user rups
		}

		return rupsToFilter.filter((rup) => {
			const searchMatch = !q || rup.title.toLowerCase().includes(q) || rup.group.specialty.toLowerCase().includes(q)

			if (!searchMatch) {
				return false
			}
			if (status !== 'ALL' && rup.status !== status) {
				return false
			}
			if (year !== 'ALL' && rup.year !== year) {
				return false
			}
			if (specialty !== 'ALL' && rup.group.specialty !== specialty) {
				return false
			}

			return true
		})
	}, [allRups, searchParams, role, userId])

	const totalPages = Math.ceil(filteredRups.length / ITEMS_PER_PAGE)
	const paginatedRups = filteredRups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

	return (
		<div className='space-y-6 p-6'>
			<RoleSwitcher />
			<div className='space-y-1'>
				<h1 className='text-3xl font-bold tracking-tight'>
					{role === 'TEACHER' ? 'Мои рабочие учебные планы' : 'Все рабочие учебные планы'}
				</h1>
				<p className='text-muted-foreground'>
					{role === 'TEACHER'
						? 'Здесь вы можете создавать и управлять своими рабочими учебными планами.'
						: 'Реестр всех рабочих учебных планов для проверки и утверждения.'}
				</p>
			</div>

			<div className='grid gap-6 lg:grid-cols-4'>
				{role === 'TEACHER' && (
					<div className='lg:col-span-1'>
						<NewCard className='h-full justify-between' />
					</div>
				)}
				<div className={role === 'TEACHER' ? 'lg:col-span-3' : 'lg:col-span-4'}>
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
