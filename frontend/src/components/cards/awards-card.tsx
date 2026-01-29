'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

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
import { type IAward } from '@types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { StatusBadge } from '../badges/status-badge'
import { AwardSheet } from '../sheets/award-sheet'
import { Loader } from '../ui/loader'
import { EmptyCard } from './empty-card'

interface IProps {
	awards: IAward[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	title: ReactNode
	description?: ReactNode
	isLoading: boolean
	showCreateOnEmpty?: boolean
}

export const AwardsCard: FC<IProps> = ({
	awards,
	currentPage,
	totalPages,
	onPageChange,
	title,
	description,
	isLoading,
	showCreateOnEmpty = false,
}) => {
	const [selectedAward, setSelectedAward] = useState<IAward | null>(null)
	const isExist = awards.length > 0 && !isLoading

	if (showCreateOnEmpty && !isExist && !isLoading) return <EmptyCard type='AWARD' />

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<div className='relative overflow-x-auto min-w-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Преподаватель</TableHead>
									<TableHead>Критерия</TableHead>
									<TableHead>Описание</TableHead>
									<TableHead>Кол. баллов</TableHead>
									<TableHead>Кол. файлов</TableHead>
									<TableHead className='text-right'>Статус</TableHead>
									{/* Убрали колонку "Действия", так как кликаем по строке */}
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									awards.map((item) => <AwardRow key={item.id} award={item} onSelect={setSelectedAward} />)
								) : (
									<TableRow>
										<TableCell className='h-44 text-center' colSpan={6}>
											{isLoading ? (
												<Loader
													className='flex flex-col justify-center items-center'
													fullScreen={false}
													type='data'
												/>
											) : (
												'Пока ничего нет.'
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

			<AwardSheet award={selectedAward} onSelect={(award) => setSelectedAward(award)} />
		</>
	)
}

interface IAwardRow {
	award: IAward
	onSelect: (award: IAward) => void
}

const AwardRow: FC<IAwardRow> = ({ award, onSelect }) => {
	const teacherName = `${award?.teacher?.firstName} ${award?.teacher.lastName}`.trim() || 'Неизвестно'

	return (
		<TableRow className='cursor-pointer hover:bg-muted/50 transition-colors' onClick={() => onSelect(award)}>
			<TableCell className='font-medium whitespace-break-spaces min-w-[100px]'>{teacherName}</TableCell>
			<TableCell className='font-medium whitespace-break-spaces min-w-[300px] py-4'>
				{`${award.variant.name}, ${award.criteria.name}`}
			</TableCell>
			<TableCell className='font-medium whitespace-break-spaces min-w-[200px] py-4'>
				{award.text || 'Пусто'}
			</TableCell>
			<TableCell className='py-6'>{award.totalPoints || 0}</TableCell>
			<TableCell className='py-6'>{award.files?.length || 0}</TableCell>
			<TableCell className='text-right'>
				<StatusBadge status={award.status} />
			</TableCell>
		</TableRow>
	)
}
