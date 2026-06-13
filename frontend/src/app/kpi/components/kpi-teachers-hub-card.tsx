'use client'

import { type FC, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { DepartmentBadge, Loader, UserTypeBadge } from '@components'
import { getUILocaleSection, getUserTotalPoints, normalizeTotalPoints, normalizeUserRole } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Separator,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { type IReviewTeacherSummaryResponse, type IUser } from '@types'
import { ArrowRight, FileSearch, Search, User } from 'lucide-react'

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

export const KpiTeachersHubCard: FC<IProps> = ({ className, profileTab = 'kpi' }) => {
	const locale = useLocaleStore((state) => state.locale)
	const user = useAuthStore((state) => state.user)
	const t = getUILocaleSection(localeDictionary, locale)
	const searchT = t.userSearch
	const reviewT = t.reviewTeachers
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
		enabled: shouldSearch && !!user,
	})
	const { data: reviewTeachers = [], isLoading: isReviewTeachersLoading } = useQuery({
		...services.award.getReviewTeachersOptions(),
		enabled: !!user,
	})

	const teacherUsers = useMemo(() => usersData?.data.filter((user) => user.role) ?? [], [usersData])
	const hasReviewTeachers = reviewTeachers.length > 0
	const totalReviewAwardsCount = useMemo(
		() => reviewTeachers.reduce((sum, teacher) => sum + teacher.reviewAwardsCount, 0),
		[reviewTeachers],
	)

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
		const totalPoints = getUserTotalPoints(user)

		return (
			<Link
				key={user.keycloakId}
				className='flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60'
				href={`/users/${user.keycloakId}?tab=${profileTab}`}
			>
				<div className='min-w-0 flex-1'>
					<p className='truncate font-medium hover:underline'>{fullName}</p>
					<p className='truncate text-xs text-muted-foreground'>{user.username}</p>
					<div className='mt-1 flex flex-wrap items-center gap-1.5'>
						<UserTypeBadge className='h-5 px-1.5' locale={locale} size='sm' userType={user.userType} />
						<DepartmentBadge className='h-5 px-1.5' departments={user.departments} locale={locale} size='sm' />
					</div>
				</div>

				<div className='flex shrink-0 items-center gap-2'>
					<Badge variant='secondary'>{normalizeUserRole(user.role, locale)}</Badge>
					<Badge variant='outline'>{normalizeTotalPoints(totalPoints, locale)}</Badge>
					<ArrowRight className='h-4 w-4 text-muted-foreground' />
				</div>
			</Link>
		)
	}

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className='space-y-1'>
				<CardTitle className='flex items-center gap-2 text-base'>
					<Search className='h-5 w-5 text-primary' />
					{searchT.title}
				</CardTitle>
				<CardDescription className='text-sm'>{searchT.description}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				<div className='relative w-full max-w-lg'>
					<label className='text-xs font-medium text-muted-foreground'>{searchT.label}</label>
					<Input
						autoComplete='off'
						className='h-9'
						placeholder={searchT.placeholder}
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
											<p>{searchT.empty}</p>
											<p>{searchT.emptyHint}</p>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				<div className='space-y-3 rounded-xl'>
					<div className='flex flex-wrap items-start justify-between gap-3'>
						<div className='space-y-1'>
							<div className='flex items-center gap-2'>
								<FileSearch className='h-4 w-4 text-primary' />
								<p className='text-sm font-semibold'>{reviewT.title}</p>
							</div>
							<p className='text-xs text-muted-foreground'>{reviewT.description}</p>
						</div>

						<div className='flex flex-wrap gap-2'>
							<div className='rounded-lg border bg-primary/10 px-3 py-2'>
								<p className='text-[11px] font-medium uppercase tracking-wide text-primary/80'>
									{reviewT.teacherCountLabel}
								</p>
								<Badge className='mt-2 px-3 py-1 text-sm font-semibold' variant='default'>
									{reviewTeachers.length}
								</Badge>
							</div>
							<div className='rounded-lg border bg-muted/60 px-3 py-2'>
								<p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
									{reviewT.pendingAwardsCountLabel}
								</p>
								<Badge className='mt-2 px-3 py-1 text-sm font-semibold' variant='outline'>
									{totalReviewAwardsCount}
								</Badge>
							</div>
						</div>
					</div>

					<div className='relative hidden w-full overflow-x-auto md:block'>
						<Table className='min-w-180'>
							<TableHeader>
								<TableRow>
									<TableHead className='pl-4 font-semibold'>{reviewT.fullName}</TableHead>
									<TableHead className='font-semibold'>{reviewT.login}</TableHead>
									<TableHead className='font-semibold'>{reviewT.points}</TableHead>
									<TableHead className='font-semibold'>{reviewT.count}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{hasReviewTeachers ? (
									reviewTeachers.map((teacher) => (
										<ReviewTeacherRow key={teacher.keycloakId} teacher={teacher} />
									))
								) : (
									<TableRow>
										<TableCell className='h-32 text-center' colSpan={4}>
											{isReviewTeachersLoading ? (
												<Loader
													className='flex flex-col items-center justify-center'
													fullScreen={false}
													type='data'
												/>
											) : (
												reviewT.empty
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className='space-y-3 md:hidden'>
						{hasReviewTeachers ? (
							reviewTeachers.map((teacher) => (
								<ReviewTeacherMobileCard key={teacher.keycloakId} teacher={teacher} />
							))
						) : (
							<div className='flex min-h-28 items-center justify-center rounded-xl border bg-background px-4 text-center text-sm text-muted-foreground'>
								{isReviewTeachersLoading ? (
									<Loader
										className='flex flex-col items-center justify-center'
										fullScreen={false}
										type='data'
									/>
								) : (
									reviewT.empty
								)}
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

interface IReviewTeacherRowProps {
	teacher: IReviewTeacherSummaryResponse
}

const ReviewTeacherRow: FC<IReviewTeacherRowProps> = ({ teacher }) => {
	const router = useRouter()
	const locale = useLocaleStore((state) => state.locale)

	const fullName = `${teacher.firstName} ${teacher.lastName}`.trim() || '—'

	return (
		<TableRow
			className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70'
			role='button'
			tabIndex={0}
			onClick={() => router.push(`/users/${teacher.keycloakId}?tab=kpi`)}
			onKeyDown={(event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return
				event.preventDefault()
				router.push(`/users/${teacher.keycloakId}?tab=kpi`)
			}}
		>
			<TableCell className='pl-4 font-medium'>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
						<User className='h-5 w-5' />
					</div>
					<div className='min-w-0'>
						<p className='truncate font-medium capitalize'>{fullName}</p>
					</div>
				</div>
			</TableCell>
			<TableCell className='font-medium'>{teacher.username}</TableCell>
			<TableCell>
				<Badge variant='default'>{teacher.totalPoints.toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')}</Badge>
			</TableCell>
			<TableCell>
				<Badge variant='outline'>
					{teacher.reviewAwardsCount.toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')}
				</Badge>
			</TableCell>
		</TableRow>
	)
}

interface IReviewTeacherMobileCardProps {
	teacher: IReviewTeacherSummaryResponse
}

const ReviewTeacherMobileCard: FC<IReviewTeacherMobileCardProps> = ({ teacher }) => {
	const locale = useLocaleStore((state) => state.locale)
	const fullName = `${teacher.firstName} ${teacher.lastName}`.trim() || '—'

	return (
		<Link
			className='block rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40'
			href={`/users/${teacher.keycloakId}?tab=kpi`}
		>
			<div className='flex items-start gap-3'>
				<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
					<User className='h-5 w-5' />
				</div>
				<div className='min-w-0 flex-1'>
					<p className='truncate font-medium capitalize'>{fullName}</p>
					<p className='truncate text-xs text-muted-foreground'>{teacher.username}</p>
					<div className='mt-3 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2'>
							<Badge variant='outline'>
								{teacher.totalPoints.toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')}
							</Badge>
							<Badge variant='secondary'>
								{teacher.reviewAwardsCount.toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')}
							</Badge>
						</div>
						<ArrowRight className='h-4 w-4 text-muted-foreground' />
					</div>
				</div>
			</div>
		</Link>
	)
}
