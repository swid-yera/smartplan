'use client'

import { useEffect, useMemo, useState } from 'react'

import type { NextPage } from 'next'
import { useSearchParams } from 'next/navigation'

import { getAllRupModules } from '@services'
import type { IRupModule } from '@types'

import { FilterCard } from './filter-card'
import { NewCard } from './new-card'
import { RupsCard } from './rups-card'

const ITEMS_PER_PAGE = 10

const Page: NextPage = () => {
	const [allRups, setAllRups] = useState<IRupModule[]>([])
	const [currentPage, setCurrentPage] = useState(1)
	const searchParams = useSearchParams()

	useEffect(() => {
		const fetchRups = async () => {
			const data = await getAllRupModules()

			if (data) {
				setAllRups(data)
			}
		}

		fetchRups()
	}, [])

	// Reset page to 1 when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [searchParams])

	const filteredRups = useMemo(() => {
		const q = searchParams.get('q')?.toLowerCase().trim()
		const status = searchParams.get('status')
		const year = searchParams.get('year')
		const specialty = searchParams.get('specialty')

		return allRups.filter((rup) => {
			if (q && !(rup.title.toLowerCase().includes(q) || rup.group.name.toLowerCase().includes(q))) {
				return false
			}
			if (status && status !== 'ALL' && rup.status !== status) {
				return false
			}
			if (year && year !== 'ALL' && rup.year !== year) {
				return false
			}
			// NOTE: Assuming `rup.group.name` is the specialty. The provided types for `IGroup` are incomplete.
			if (specialty && specialty !== 'ALL' && rup.group.name !== specialty) {
				return false
			}

			return true
		})
	}, [allRups, searchParams])

	const totalPages = Math.ceil(filteredRups.length / ITEMS_PER_PAGE)
	const paginatedRups = filteredRups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

	return (
		<div className='space-y-6 p-6'>
			<div className='space-y-1'>
				<h1 className='text-3xl font-bold tracking-tight'>Все рабочие учебные планы</h1>
				<p className='text-muted-foreground'>
					Реестр рабочих учебных планов с фильтрами по специальности, году и статусу.
				</p>
			</div>

			<div className='grid gap-6 lg:grid-cols-4'>
				<div className='lg:col-span-1'>
					<NewCard className='h-full justify-between' />
				</div>
				<div className='lg:col-span-3'>
					<FilterCard className='h-full' />
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
