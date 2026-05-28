'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import { formatAsDash, getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import {
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
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
					<div className='relative overflow-x-auto min-w-0'>
						<Table className='min-w-[200px]'>
							<TableHeader>
								<TableRow>
									<TableHead>{t.name}</TableHead>
									<TableHead>{t.teacher}</TableHead>
									<TableHead>{t.specialty}</TableHead>
									<TableHead>{t.qualification}</TableHead>
									<TableHead>{t.studyYear}</TableHead>
									<TableHead className='text-right'>{t.status}</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									rups.map((item) => <RupRow key={item.id} rup={item} onSelect={setSelectedRup} />)
								) : (
									<TableRow>
										<TableCell className='h-40 text-center' colSpan={6}>
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
}

const RupRow: FC<IRupRow> = ({ rup, onSelect }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).rupsCard

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
				{rup?.name || t.untitled}
			</TableCell>
			<TableCell className='whitespace-break-spaces min-w-[100px]'>
				{rup?.teacher?.firstName || t.unknownTeacher}
			</TableCell>
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
