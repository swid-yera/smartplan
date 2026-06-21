'use client'

import { type FC, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getUILocaleSection } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowRight, Search, User } from 'lucide-react'

import localeDictionary from './locale.json'

interface IProps {
	className?: string
}

const useDebouncedValue = (value: string, delay = 300) => {
	const [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedValue(value), delay)

		return () => clearTimeout(timeout)
	}, [delay, value])

	return debouncedValue
}

export const RupsReviewTeachersCard: FC<IProps> = ({ className }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).rupsReviewTeachersHub
	const router = useRouter()
	const [searchInput, setSearchInput] = useState('')
	const debouncedSearch = useDebouncedValue(searchInput.trim())
	const skeletonRows = useMemo(() => Array.from({ length: 5 }, (_, index) => index), [])

	const { data: teachersData = [], isFetching } = useQuery({
		...services.rup.getReviewTeachersOptions(debouncedSearch),
		placeholderData: keepPreviousData,
	})

	const hasTeachers = teachersData.length > 0

	const renderTeacherRow = (teacher: (typeof teachersData)[number]) => {
		const fullName = `${teacher.firstName} ${teacher.lastName}`.trim() || '—'

		return (
			<TableRow
				key={teacher.keycloakId}
				className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70'
				role='button'
				tabIndex={0}
				onClick={() => router.push(`/users/${teacher.keycloakId}?tab=rups`)}
				onKeyDown={(event) => {
					if (event.key !== 'Enter' && event.key !== ' ') return
					event.preventDefault()
					router.push(`/users/${teacher.keycloakId}?tab=rups`)
				}}
			>
				<TableCell className='pl-4 font-medium'>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<User className='h-5 w-5' />
						</div>
						<div className='min-w-0'>
							<Link
								className='block truncate font-medium hover:underline'
								href={`/users/${teacher.keycloakId}?tab=rups`}
								onClick={(event) => event.stopPropagation()}
							>
								{fullName}
							</Link>
						</div>
					</div>
				</TableCell>
				<TableCell className='font-medium'>{teacher.username}</TableCell>
				<TableCell className='pr-4 text-right'>
					<ArrowRight className='ml-auto h-4 w-4 text-muted-foreground' />
				</TableCell>
			</TableRow>
		)
	}

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className='space-y-1'>
				<CardTitle className='flex items-center gap-2 text-base'>
					<Search className='h-5 w-5 text-primary' />
					{t.title}
				</CardTitle>
				<CardDescription className='text-sm'>{t.description}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-4'>
				<div className='w-full max-w-lg space-y-1'>
					<label className='text-xs font-medium text-muted-foreground'>{t.searchLabel}</label>
					<Input
						autoComplete='off'
						className='h-9'
						placeholder={t.searchPlaceholder}
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
					/>
				</div>

				<div className='relative hidden min-w-0 overflow-x-auto md:block'>
					<Table className='min-w-[40rem]'>
						<TableHeader>
							<TableRow>
								<TableHead className='pl-4 font-semibold'>{t.fullName}</TableHead>
								<TableHead className='font-semibold'>{t.login}</TableHead>
								<TableHead className='pr-4 text-right font-semibold' />
							</TableRow>
						</TableHeader>
						<TableBody>
							{hasTeachers ? (
								teachersData.map((teacher) => renderTeacherRow(teacher))
							) : (
								<TableRow>
									<TableCell className='h-32 text-center' colSpan={3}>
										{isFetching ? (
											<div className='space-y-2'>
												{skeletonRows.slice(0, 1).map((row) => (
													<Skeleton key={row} className='h-9 w-full rounded-lg' />
												))}
											</div>
										) : (
											t.empty
										)}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className='space-y-3 md:hidden'>
					{hasTeachers ? (
						teachersData.map((teacher) => {
							const fullName = `${teacher.firstName} ${teacher.lastName}`.trim() || '—'

							return (
								<Link
									key={teacher.keycloakId}
									className='block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40'
									href={`/users/${teacher.keycloakId}?tab=rups`}
								>
									<div className='flex items-start gap-3'>
										<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
											<User className='h-5 w-5' />
										</div>
										<div className='min-w-0 flex-1'>
											<p className='truncate font-medium'>{fullName}</p>
											<p className='truncate text-xs text-muted-foreground'>{teacher.username}</p>
											<div className='mt-3 flex items-center justify-end'>
												<ArrowRight className='h-4 w-4 text-muted-foreground' />
											</div>
										</div>
									</div>
								</Link>
							)
						})
					) : (
						<div className='flex min-h-28 items-center justify-center rounded-xl border bg-background px-4 text-center text-sm text-muted-foreground'>
							{isFetching ? (
								<div className='w-full space-y-2'>
									{skeletonRows.slice(0, 1).map((row) => (
										<Skeleton key={row} className='h-10 w-full rounded-lg' />
									))}
								</div>
							) : (
								t.empty
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
