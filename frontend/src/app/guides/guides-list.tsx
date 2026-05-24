'use client'

import { useMemo, useState } from 'react'

import { Badge, Card, CardContent, CardHeader, CardTitle, Input } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IGuide } from '@types'
import { BookOpen, Lock } from 'lucide-react'

import { guides } from './data.mock'
import locale from './locale.json'

export const GuidesList = () => {
	const currentLocale = useLocaleStore((state) => state.locale)
	const t = locale[currentLocale] ?? locale.ru
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
				placeholder={t.searchPlaceholder}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>

			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{filtered.length ? (
					filtered.map((guide) => <GuideCard key={guide.id} disabled guide={guide} />)
				) : (
					<p className='text-muted-foreground'>{t.notFound}</p>
				)}
			</div>
		</div>
	)
}

// guide card
interface IProps {
	guide: IGuide
	disabled?: boolean
}

export const GuideCard = ({ guide, disabled = false }: IProps) => {
	const currentLocale = useLocaleStore((state) => state.locale)
	const t = locale[currentLocale] ?? locale.ru

	return (
		<Card
			className={`
				hover:shadow-lg transition relative
				${disabled ? 'bg-muted/20 border border-muted/40 cursor-not-allowed' : 'hover:bg-background'}
			`}
			onClick={() => {
				if (disabled) return
				// тут открытие гида
			}}
		>
			{disabled && (
				<div className='absolute top-3 right-3 flex items-center gap-1'>
					<Lock className='h-4 w-4 text-muted-foreground' />
					<Badge className='text-muted-foreground' variant='outline'>
						{t.inDevelopment}
					</Badge>
				</div>
			)}

			<CardHeader>
				<CardTitle className={`flex items-center gap-2 ${disabled ? 'text-muted-foreground' : ''}`}>
					<BookOpen className={`h-5 w-5 ${disabled ? 'text-muted-foreground' : 'text-primary'}`} />
					{guide.title}
				</CardTitle>
			</CardHeader>

			<CardContent className={`space-y-2 ${disabled ? 'text-muted-foreground' : ''}`}>
				<p className='text-sm'>{guide.description}</p>

				<div className='flex items-center gap-2'>
					<Badge variant='secondary'>{guide.category}</Badge>
					<Badge variant='outline'>{guide.level}</Badge>
				</div>

				<p className='text-xs'>
					{t.updatedAt}: {guide.updatedAt}
				</p>
			</CardContent>
		</Card>
	)
}
