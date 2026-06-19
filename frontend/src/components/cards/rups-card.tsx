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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IRup, type Locale } from '@types'
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
	const locale = useLocaleStore((state) => state.locale) as Locale
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
						<Table className='min-w-50'>
							<TableHeader>
								<TableRow>
									<TableHead>{t.name}</TableHead>
									<TableHead>{t.teacher}</TableHead>
									{showGroupsColumn && <TableHead>{t.groups}</TableHead>}
									<TableHead>
										<p>{t.specialty}</p>
										<p>{t.qualification}</p>
									</TableHead>
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
							{interpolateUILocaleText(t.page, {
								current: currentPage,
								total: totalPages,
							})}
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

const getRupGroupsText = (rup: IRup) =>
	formatAsDash(
		rup?.groups
			?.map((group) => group.name)
			.filter(Boolean)
			.join(', '),
	)

const getRupSpecialtyQualificationText = (rup: IRup, locale: Locale) => {
	const specialty = getLocaleText(rup?.groups[0]?.specialty, locale)
	const qualification = getLocaleText(rup?.groups[0]?.qualification, locale)

	return {
		specialty: formatAsDash(specialty),
		qualification: formatAsDash(qualification),
		combined: formatAsDash([specialty, qualification].filter(Boolean).join(' · ')),
	}
}

const RupMobileCard: FC<IRupRow> = ({ rup, onSelect, showGroupsColumn = false }) => {
	const locale = useLocaleStore((state) => state.locale) as Locale
	const t = getUILocaleSection(localeDictionary, locale).rupsCard
	const title = getLocaleText(rup?.name, locale) || t.untitled
	const teacherName = `${rup?.teacher?.firstName || ''} ${rup?.teacher?.lastName || ''}`.trim() || t.unknownTeacher
	const groups = getRupGroupsText(rup)
	const specialtyQualification = getRupSpecialtyQualificationText(rup, locale)
	const teacherHref = rup?.teacher?.keycloakId ? `/users/${rup.teacher.keycloakId}?tab=rups` : undefined

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
						{teacherHref ? (
							<Link
								className='min-w-0 truncate text-right font-medium hover:text-primary hover:underline'
								href={teacherHref}
								onClick={(event) => event.stopPropagation()}
							>
								{teacherName}
							</Link>
						) : (
							<span className='min-w-0 truncate text-right font-medium'>{teacherName}</span>
						)}
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
					<Tooltip>
						<TooltipTrigger asChild>
							<div className='flex cursor-help items-center justify-between gap-3'>
								<span className='inline-flex items-center gap-2 text-muted-foreground'>
									<GraduationCap className='h-4 w-4 shrink-0' />
									{`${t.specialty} / ${t.qualification}`}
								</span>
								<span className='min-w-0 max-w-[16rem] truncate text-right font-medium'>
									{specialtyQualification.combined}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='top' sideOffset={8}>
							<div className='space-y-1'>
								<p>{`${t.specialty}: ${specialtyQualification.specialty}`}</p>
								<p>{`${t.qualification}: ${specialtyQualification.qualification}`}</p>
							</div>
						</TooltipContent>
					</Tooltip>
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
	const groups = getRupGroupsText(rup)
	const specialtyQualification = getRupSpecialtyQualificationText(rup, locale)
	const teacherHref = rup?.teacher?.keycloakId ? `/users/${rup.teacher.keycloakId}?tab=rups` : undefined

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
			<TableCell className='align-top font-medium whitespace-normal py-4 w-[18rem] max-w-[18rem]'>
				<Link
					className='block max-w-full rounded-sm hover:text-primary hover:underline'
					href={`/rups/${rup.id}`}
					title={getLocaleText(rup?.name, locale) || t.untitled}
					onClick={(event) => event.stopPropagation()}
				>
					<span className='block whitespace-normal wrap-break-word leading-6'>
						{getLocaleText(rup?.name, locale) || t.untitled}
					</span>
				</Link>
			</TableCell>
			<TableCell className='whitespace-normal min-w-40 max-w-[16rem] align-top py-4'>
				{teacherHref ? (
					<Link
						className='block max-w-full rounded-sm font-medium hover:text-primary hover:underline'
						href={teacherHref}
						title={`${rup?.teacher?.firstName || ''} ${rup?.teacher?.lastName || ''}`.trim() || t.unknownTeacher}
						onClick={(event) => event.stopPropagation()}
					>
						<span className='block whitespace-normal wrap-break-word leading-6'>
							{`${rup?.teacher?.firstName || ''} ${rup?.teacher?.lastName || ''}`.trim() || t.unknownTeacher}
						</span>
					</Link>
				) : (
					<span>{t.unknownTeacher}</span>
				)}
			</TableCell>
			{showGroupsColumn && (
				<TableCell className='whitespace-normal min-w-50` max-w-[18rem] align-top py-4'>
					<span className='block whitespace-normal wrap-break-word leading-6'>{groups}</span>
				</TableCell>
			)}
			<TableCell className='whitespace-normal min-w-50` max-w-[18rem] align-top py-4'>
				<Tooltip>
					<TooltipTrigger asChild>
						<div className='cursor-help'>
							<p className='block whitespace-normal text-xs wrap-break-word leading-6'>
								{specialtyQualification.combined}
							</p>
						</div>
					</TooltipTrigger>
					<TooltipContent side='top' sideOffset={8}>
						<div className='space-y-1'>
							<p>{`${t.specialty}: ${specialtyQualification.specialty}`}</p>
							<p>{`${t.qualification}: ${specialtyQualification.qualification}`}</p>
						</div>
					</TooltipContent>
				</Tooltip>
			</TableCell>
			<TableCell>{formatAsDash(rup?.studyYear)}</TableCell>
			<TableCell className='text-right'>
				<StatusBadge status={rup.status} />
			</TableCell>
		</TableRow>
	)
}
