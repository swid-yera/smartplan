'use client'

import { type FC, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import { getUILocaleSection, normalizeTotalPoints, normalizeUserRole } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Separator, Skeleton } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { type IUser } from '@types'
import { ArrowRight, Search } from 'lucide-react'

import localeDictionary from './locale.json'

interface IProps {
	className?: string
	profileTab?: string
}

const useDebouncedValue = (value: string, delay = 300) => {
	const [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedValue(value), delay)

		return () => clearTimeout(timeout)
	}, [delay, value])

	return debouncedValue
}

export const KpiUserSearchCard: FC<IProps> = ({ className, profileTab = 'kpi' }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).userSearch
	const [searchInput, setSearchInput] = useState('')
	const [panelMounted, setPanelMounted] = useState(false)
	const [panelVisible, setPanelVisible] = useState(false)
	const debouncedSearch = useDebouncedValue(searchInput.trim())

	const shouldSearch = debouncedSearch.length >= 3
	const skeletonRows = useMemo(() => Array.from({ length: 5 }, (_, index) => index), [])

	const { data: usersData, isFetching } = useQuery({
		...services.user.getAllOptions({
			currentPage: 1,
			pageSize: 5,
			search: debouncedSearch,
		}),
		enabled: shouldSearch,
	})

	const teacherUsers = useMemo(() => usersData?.data.filter((user) => user.role) ?? [], [usersData])

	useEffect(() => {
		let openTimer: ReturnType<typeof setTimeout> | undefined
		let closeTimer: ReturnType<typeof setTimeout> | undefined

		if (shouldSearch) {
			setPanelMounted(true)
			openTimer = setTimeout(() => setPanelVisible(true), 0)
		} else {
			setPanelVisible(false)
			closeTimer = setTimeout(() => setPanelMounted(false), 180)
		}

		return () => {
			if (openTimer) clearTimeout(openTimer)
			if (closeTimer) clearTimeout(closeTimer)
		}
	}, [shouldSearch])

	const renderUserRow = (user: IUser) => {
		const fullName = `${user.firstName} ${user.lastName}`.trim()

		return (
			<Link
				key={user.keycloakId}
				className='flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60'
				href={`/users/${user.keycloakId}?tab=${profileTab}`}
			>
				<div className='min-w-0 flex-1'>
					<p className='truncate font-medium hover:underline'>{fullName}</p>
					<p className='truncate text-xs text-muted-foreground'>{user.username}</p>
				</div>

				<div className='flex shrink-0 items-center gap-2'>
					<Badge variant='secondary'>{normalizeUserRole(user.role, locale)}</Badge>
					<Badge variant='outline'>{normalizeTotalPoints(user.totalPoints ?? 0, locale)}</Badge>
					<ArrowRight className='h-4 w-4 text-muted-foreground' />
				</div>
			</Link>
		)
	}

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className='space-y-1 pb-3'>
				<CardTitle className='flex items-center gap-2 text-base'>
					<Search className='h-5 w-5 text-primary' />
					{t.title}
				</CardTitle>
				<CardDescription className='text-sm'>{t.description}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-3'>
				<div className='relative w-full max-w-xs sm:max-w-sm'>
					<label className='text-xs font-medium text-muted-foreground'>{t.label}</label>
					<Input
						autoComplete='off'
						className='h-9'
						placeholder={t.placeholder}
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>

					{panelMounted && (
						<div className='absolute top-full left-0 right-0 z-20 pt-2'>
							<div
								className={cn(
									'transform-gpu overflow-hidden rounded-lg border bg-background shadow-lg transition-[max-height,opacity,transform] duration-200 ease-out motion-reduce:transition-none',
									panelVisible
										? 'pointer-events-auto max-h-105 translate-y-0 scale-100 opacity-100'
										: 'pointer-events-none max-h-0 -translate-y-2 scale-95 opacity-0',
								)}
							>
								<div className='max-h-80 overflow-auto p-1.5'>
									{isFetching ? (
										<div className='space-y-2'>
											{skeletonRows.slice(0, 1).map((row) => (
												<Skeleton key={row} className='h-9 w-full rounded-lg' />
											))}
										</div>
									) : teacherUsers.length > 0 ? (
										<div className='space-y-1'>
											{teacherUsers.map((user, index) => (
												<div key={user.keycloakId}>
													{index > 0 && <Separator className='my-1' />}
													{renderUserRow(user)}
												</div>
											))}
										</div>
									) : (
										<div className='p-3 text-sm text-muted-foreground'>
											<p>{t.empty}</p>
											<p>{t.emptyHint}</p>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
