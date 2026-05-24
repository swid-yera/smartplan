'use client'

import { type FC, useMemo, useState } from 'react'

import { getLocaleText } from '@helpers'
import { Card, CardContent, CardHeader, CardTitle, Input } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IGroup } from '@types'
import { Users } from 'lucide-react'

import locale from './locale.json'

interface IProps {
	groups: IGroup[]
}

const getGroupTextValue = (value: unknown, localeCode: 'ru' | 'kk'): string => {
	if (!value) return ''
	if (typeof value === 'string') return value

	return getLocaleText(value as Parameters<typeof getLocaleText>[0], localeCode)
}

export const GroupsCard: FC<IProps> = ({ groups }) => {
	const localeCode = useLocaleStore((state) => state.locale)
	const t = locale[localeCode] ?? locale.ru
	const [search, setSearch] = useState('')

	const filteredGroups = useMemo(() => {
		if (!search) return groups

		const value = search.toLowerCase()

		return groups.filter((group) => {
			const fields = [group.name, group.specialty, group.qualification].map((field) =>
				getGroupTextValue(field, localeCode).toLowerCase(),
			)

			return fields.some((field) => field.includes(value))
		})
	}, [groups, localeCode, search])

	return (
		<Card>
			<CardHeader className='space-y-3'>
				<CardTitle className='flex items-center gap-2'>
					<Users className='h-5 w-5 text-primary' />
					{t.groupsCard.title}
				</CardTitle>

				{/* search */}
				<Input
					className='max-w-sm'
					placeholder={t.groupsCard.searchPlaceholder}
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
								<p className='font-medium'>{getGroupTextValue(group.name, localeCode)}</p>
								<p className='text-sm text-muted-foreground'>
									{t.groupsCard.specialty}: {getGroupTextValue(group.specialty, localeCode) || '—'}
								</p>
								<p className='text-sm text-muted-foreground'>
									{t.groupsCard.qualification}: {getGroupTextValue(group.qualification, localeCode) || '—'}
								</p>
							</div>
						</div>
					))
				) : (
					<p className='text-center text-muted-foreground py-8'>
						{search ? t.groupsCard.notFound : t.groupsCard.empty}
					</p>
				)}
			</CardContent>
		</Card>
	)
}
