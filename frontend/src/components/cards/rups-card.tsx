'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import Link from 'next/link'

import { formatAsDash, getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IRup } from '@types'
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, User } from 'lucide-react'

import { StatusBadge } from '../badges/status-badge'
import { RupSheet } from '../sheets/rup-sheet'
import { Loader } from '../ui/loader'
import { EmptyCard } from './empty-card'
import localeDictionary from './locale.json'

interface IRupsProps {
	rups: IRup[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	title: ReactNode
	description?: ReactNode
	isLoading: boolean
	className?: string
	showCreateOnEmpty?: boolean
	showGroupsColumn?: boolean
}

export const RupsCard: FC<IRupsProps> = ({
	rups,
	currentPage,
	totalPages,
	onPageChange,
	title,
	description,
	isLoading,
	className,
	showCreateOnEmpty = false,
	showGroupsColumn = false,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).rupsCard
	const [selectedRup, setSelectedRup] = useState<IRup | null>(null)
	const isExist = rups.length > 0 && !isLoading

	if (showCreateOnEmpty && !isExist && !isLoading) return <EmptyCard type='RUP' />

	return (
		<>
			<Card className={className}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<div className='relative hidden min-w-0 overflow-x-auto md:block'>
						<Table className='min-w-[200px]'>
							<TableHeader>
								<TableRow>
									<TableHead>{t.name}</TableHead>
									<TableHead>{t.teacher}</TableHead>
									{showGroupsColumn && <TableHead>{t.groups}</TableHead>}
									<TableHead>{t.specialty}</TableHead>
									<TableHead>{t.qualification}</TableHead>
									<TableHead>{t.studyYear}</TableHead>
									<TableHead className='text-right'>{t.status}</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									rups.map((item) => (
										<RupRow
											key={item.id}
											rup={item}
											showGroupsColumn={showGroupsColumn}
											onSelect={setSelectedRup}
										/>
									))
								) : (
									<TableRow>
										<TableCell className='h-40 text-center' colSpan={showGroupsColumn ? 7 : 6}>
											{isLoading ? (
												<Loader
													className='flex flex-col justify-center items-center'
													fullScreen={false}
													type='data'
												/>
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
						{isExist ? (
							rups.map((rup) => (
								<RupMobileCard
									key={rup.id}
									rup={rup}
									showGroupsColumn={showGroupsColumn}
									onSelect={setSelectedRup}
								/>
							))
						) : (
							<div className='flex min-h-40 items-center justify-center rounded-xl border bg-background px-4 text-center text-sm text-muted-foreground'>
								{isLoading ? (
									<Loader
										className='flex flex-col items-center justify-center'
										fullScreen={false}
										type='data'
									/>
								) : (
									t.empty
								)}
							</div>
						)}
					</div>
				</CardContent>

				{totalPages > 1 && (
					<CardFooter className='flex items-center justify-end space-x-2'>
						<Button
							disabled={currentPage <= 1}
							size='sm'
							variant='outline'
							onClick={() => onPageChange(currentPage - 1)}
						>
							<ChevronLeft className='h-4 w-4 mr-2' />
							{t.back}
						</Button>
						<div className='text-sm font-medium'>
							{interpolateUILocaleText(t.page, { current: currentPage, total: totalPages })}
						</div>
						<Button
							disabled={currentPage >= totalPages}
							size='sm'
							variant='outline'
							onClick={() => onPageChange(currentPage + 1)}
						>
							{t.next}
							<ChevronRight className='h-4 w-4 ml-2' />
						</Button>
					</CardFooter>
				)}
			</Card>

			<RupSheet rup={selectedRup} onSelect={(rup) => setSelectedRup(rup)} />
		</>
	)
}

interface IRupRow {
	rup: IRup
	onSelect: (rup: IRup) => void
	showGroupsColumn?: boolean
}

const RupMobileCard: FC<IRupRow> = ({ rup, onSelect, showGroupsColumn = false }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).rupsCard
	const title = getLocaleText(rup?.name, locale) || t.untitled
	const teacherName = `${rup?.teacher?.firstName || ''} ${rup?.teacher?.lastName || ''}`.trim() || t.unknownTeacher
	const groups = formatAsDash(rup?.groups?.map((group) => group.name).filter(Boolean).join(', '))
	const specialty = formatAsDash(getLocaleText(rup?.groups[0]?.specialty, locale))
	const qualification = formatAsDash(getLocaleText(rup?.groups[0]?.qualification, locale))

	return (
		<Card
			className='cursor-pointer overflow-hidden transition-colors hover:bg-muted/40'
			role='button'
			tabIndex={0}
			onClick={() => onSelect(rup)}
			onKeyDown={(event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return
				event.preventDefault()
				onSelect(rup)
			}}
		>
			<CardContent className='space-y-3 p-4'>
				<div className='flex items-start justify-between gap-3'>
					<Link
						className='min-w-0 flex-1 rounded-sm font-medium leading-snug hover:text-primary hover:underline'
						href={`/rups/${rup.id}`}
						title={title}
						onClick={(event) => event.stopPropagation()}
					>
						<span className='block truncate'>{title}</span>
					</Link>
					<StatusBadge status={rup.status} />
				</div>

				<div className='grid gap-2 rounded-lg bg-muted/20 p-3 text-sm'>
					<div className='flex items-center justify-between gap-3'>
						<span className='inline-flex items-center gap-2 text-muted-foreground'>
							<User className='h-4 w-4 shrink-0' />
							{t.teacher}
						</span>
						<span className='min-w-0 truncate text-right font-medium'>{teacherName}</span>
					</div>
					{showGroupsColumn && (
						<div className='flex items-center justify-between gap-3'>
							<span className='inline-flex items-center gap-2 text-muted-foreground'>
								<BookOpen className='h-4 w-4 shrink-0' />
								{t.groups}
							</span>
							<span className='min-w-0 truncate text-right font-medium'>{groups}</span>
						</div>
					)}
					<div className='flex items-center justify-between gap-3'>
						<span className='inline-flex items-center gap-2 text-muted-foreground'>
							<BookOpen className='h-4 w-4 shrink-0' />
							{t.specialty}
						</span>
						<span className='min-w-0 truncate text-right font-medium'>{specialty}</span>
					</div>
					<div className='flex items-center justify-between gap-3'>
						<span className='inline-flex items-center gap-2 text-muted-foreground'>
							<GraduationCap className='h-4 w-4 shrink-0' />
							{t.qualification}
						</span>
						<span className='min-w-0 truncate text-right font-medium'>{qualification}</span>
					</div>
					<div className='flex items-center justify-between gap-3'>
						<span className='text-muted-foreground'>{t.studyYear}</span>
						<Badge variant='secondary'>{formatAsDash(rup?.studyYear)}</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

const RupRow: FC<IRupRow> = ({ rup, onSelect, showGroupsColumn = false }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).rupsCard
	const groups = formatAsDash(rup?.groups?.map((group) => group.name).filter(Boolean).join(', '))

	return (
		<TableRow
			className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70'
			role='button'
			tabIndex={0}
			onClick={() => onSelect(rup)}
			onKeyDown={(event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return
				event.preventDefault()
				onSelect(rup)
			}}
		>
			<TableCell className='font-medium whitespace-break-spaces min-w-[300px] py-4'>
				<Link
					className='inline-flex max-w-full items-center rounded-sm hover:text-primary hover:underline'
					href={`/rups/${rup.id}`}
					title={getLocaleText(rup?.name, locale) || t.untitled}
					onClick={(event) => event.stopPropagation()}
				>
					<span className='truncate'>{getLocaleText(rup?.name, locale) || t.untitled}</span>
				</Link>
			</TableCell>
			<TableCell className='whitespace-break-spaces min-w-[100px]'>
				{rup?.teacher?.firstName || t.unknownTeacher}
			</TableCell>
			{showGroupsColumn && <TableCell className='whitespace-break-spaces min-w-[200px]'>{groups}</TableCell>}
			<TableCell className='whitespace-break-spaces min-w-[200px]'>
				{formatAsDash(getLocaleText(rup?.groups[0]?.specialty, locale))}
			</TableCell>
			<TableCell className='whitespace-break-spaces min-w-[200px]'>
				{formatAsDash(getLocaleText(rup?.groups[0]?.qualification, locale))}
			</TableCell>
			<TableCell>{formatAsDash(rup?.studyYear)}</TableCell>
			<TableCell className='text-right'>
				<StatusBadge status={rup.status} />
			</TableCell>
		</TableRow>
	)
}
