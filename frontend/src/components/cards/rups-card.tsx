'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import { formatAsDash } from '@helpers'
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
import { type IRup } from '@types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { StatusBadge } from '../badges/status-badge'
import { RupSheet } from '../sheets/rup-sheet'
import { Loader } from '../ui/loader'
import { EmptyCard } from './empty-card'

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
									<TableHead>Наименование</TableHead>
									<TableHead>Преподаватель</TableHead>
									<TableHead>Специальность</TableHead>
									<TableHead>Квалификация</TableHead>
									<TableHead>Учебный год</TableHead>
									<TableHead className='text-right'>Статус</TableHead>
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
												'Пока нет ни одного модуля.'
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
							Назад
						</Button>
						<div className='text-sm font-medium'>
							Страница {currentPage} из {totalPages}
						</div>
						<Button
							disabled={currentPage >= totalPages}
							size='sm'
							variant='outline'
							onClick={() => onPageChange(currentPage + 1)}
						>
							Вперед
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
	return (
		<TableRow className='cursor-pointer hover:bg-muted/50 transition-colors' onClick={() => onSelect(rup)}>
			<TableCell className='font-medium whitespace-break-spaces min-w-[300px] py-4'>
				{rup?.name || 'Без названия'}
			</TableCell>
			<TableCell className='whitespace-break-spaces min-w-[100px]'>
				{rup?.teacher?.firstName || 'Неизвестно'}
			</TableCell>
			<TableCell className='whitespace-break-spaces min-w-[200px]'>
				{formatAsDash(rup?.groups[0]?.specialty)}
			</TableCell>
			<TableCell className='whitespace-break-spaces min-w-[200px]'>
				{formatAsDash(rup?.groups[0]?.qualification)}
			</TableCell>
			<TableCell>{formatAsDash(rup?.studyYear)}</TableCell>
			<TableCell className='text-right'>
				<StatusBadge status={rup.status} />
			</TableCell>
		</TableRow>
	)
}
