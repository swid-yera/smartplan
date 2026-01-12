'use client'

import { useEffect, useState } from 'react'

import type { NextPage } from 'next'

import { getAllRupModules } from '@services'
import type { IRupModule } from '@types'
import { Heading } from '@ui'

import { FilterCard } from './filter-card'
import { NewCard } from './new-card'
import { RupsCard } from './rups-card'

interface IPageProps {
	searchParams: {
		q?: string
		status?: string
		year?: string
		specialty?: string
	}
}

const Page: NextPage<IPageProps> = () => {
	const [rupsData, setRupsData] = useState<IRupModule[]>([])

	const fetchRups = async () => {
		const data = await getAllRupModules()

		if (!data) return

		setRupsData(data)
	}

	useEffect(() => {
		fetchRups()
	}, [])

	return (
		<>
			<section className='max-w-6xl w-full mx-auto px-4 py-6 space-y-4'>
				{/* heading */}
				<div>
					<Heading align='left' size='h1'>
						Все рабочие учебные планы
					</Heading>
					<p className='text-muted-foreground'>
						Реестр рабочих учебных планов с фильтрами по специальности, году и статусу.
					</p>
				</div>

				{/* create new */}
				<NewCard />

				{/* filters */}
				<FilterCard searchParams={{}} />

				{/* rups */}
				<RupsCard rups={rupsData} />
			</section>
		</>
	)
}

export default Page
