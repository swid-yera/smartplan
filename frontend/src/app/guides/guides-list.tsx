'use client'

import { useMemo, useState } from 'react'

import { Input } from '@shadcn'

import { guides } from './data.mock'
import { GuideCard } from './guide-card'

export const GuidesList = () => {
	const [search, setSearch] = useState('')

	const filtered = useMemo(() => {
		if (!search) return guides
		const value = search.toLowerCase()

		return guides.filter((g) => [g.title, g.description, g.category].some((v) => v.toLowerCase().includes(value)))
	}, [search])

	return (
		<div className='space-y-4'>
			<Input
				className='max-w-sm'
				placeholder='Поиск по гайдам'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{filtered.length ? (
					filtered.map((guide) => <GuideCard key={guide.id} guide={guide} />)
				) : (
					<p className='text-muted-foreground'>Ничего не найдено</p>
				)}
			</div>
		</div>
	)
}
