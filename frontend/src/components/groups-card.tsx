'use client'

import { type FC, useMemo, useState } from 'react'

import type { IGroup } from '@types'
import { Card, CardContent, CardHeader, CardTitle, Input } from '@ui'
import { Users } from 'lucide-react'

interface IProps {
	groups: IGroup[]
}

export const GroupsCard: FC<IProps> = ({ groups }) => {
	const [search, setSearch] = useState('')

	const filteredGroups = useMemo(() => {
		if (!search) return groups

		const value = search.toLowerCase()

		return groups.filter((group) =>
			[group.name, group.specialty, group.qualification]
				.filter(Boolean)
				.some((field) => field!.toLowerCase().includes(value)),
		)
	}, [groups, search])

	return (
		<Card>
			<CardHeader className='space-y-3'>
				<CardTitle className='flex items-center gap-2'>
					<Users className='h-5 w-5 text-primary' />
					Список групп
				</CardTitle>

				{/* search */}
				<Input
					className='max-w-sm'
					placeholder='Поиск по группе, специальности или квалификации'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</CardHeader>

			<CardContent className='space-y-3'>
				{filteredGroups.length ? (
					filteredGroups.map((group) => (
						<div
							key={group.keycloakId}
							className='flex items-center justify-between rounded-lg border p-4
								hover:bg-muted/40 transition'
						>
							<div>
								<p className='font-medium'>{group.name}</p>
								<p className='text-sm text-muted-foreground'>Специальность: {group.specialty ?? '—'}</p>
								<p className='text-sm text-muted-foreground'>Квалификация: {group.qualification ?? '—'}</p>
							</div>
						</div>
					))
				) : (
					<p className='text-center text-muted-foreground py-8'>
						{search ? 'Ничего не найдено' : 'Группы не найдены'}
					</p>
				)}
			</CardContent>
		</Card>
	)
}
