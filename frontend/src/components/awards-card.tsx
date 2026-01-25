'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import Link from 'next/link'

import { type IAward } from '@types'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Separator,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { BookOpen, ChevronLeft, ChevronRight, SearchCode, Users } from 'lucide-react'

import { Loader } from './loader'
import { StatusBadge } from './status-badge'

interface IProps {
	awards: IAward[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	title: ReactNode
	description?: ReactNode
	isLoading: boolean
}

export const AwardsCard: FC<IProps> = ({
	awards,
	currentPage,
	totalPages,
	onPageChange,
	title,
	description,
	isLoading,
}) => {
	const [selectedAward, setSelectedAward] = useState<IAward | null>(null)
	const isExist = awards.length > 0 && !isLoading

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
										<TableCell className='h-44 text-center' colSpan={5}>
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

			<AwardSheet award={selectedAward} onSelect={(award) => setSelectedAward(award)} />
		</>
	)
}

interface IAwardRow {
	award: IAward
	onSelect: (award: IAward) => void
}

const AwardRow: FC<IAwardRow> = ({ award, onSelect }) => {
	return (
		<TableRow className='cursor-pointer hover:bg-muted/50 transition-colors' onClick={() => onSelect(award)}>
			<TableCell className='font-medium whitespace-break-spaces min-w-[100px]'>
				{award?.teacher?.firstName || 'Неизвестно'}
			</TableCell>
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

interface IAwardSheet {
	onSelect: (award: IAward | null) => void
	award: IAward | null
}

export const AwardSheet: FC<IAwardSheet> = ({ award, onSelect }) => {
	return (
		<Sheet open={!!award} onOpenChange={(open) => !open && onSelect(null)}>
			<SheetContent className='overflow-y-auto sm:max-w-md w-full'>
				{award && (
					<>
						<SheetHeader>
							<SheetTitle className='mt-2'>
								{`${award.variant.name}, ${award.criteria.name} `}
								<StatusBadge status={award.status} />
							</SheetTitle>
							<SheetDescription>Краткая информация о рабочем учебном плане.</SheetDescription>
						</SheetHeader>

						<div className='grid flex-1 auto-rows-min gap-6 px-4'>
							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<BookOpen className='w-4 h-4 mr-2' /> Основное
								</h4>

								<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
									<p className='font-medium'>Статус:</p>
									<StatusBadge status={award.status} />

									{award?.reason && (
										<>
											<p className='font-medium'>Причина отказа:</p>
											<p>{award?.reason}</p>
										</>
									)}

									<p className='font-medium'>Критерия:</p>
									<p>
										{award.variant.name}, {award.criteria.name}
									</p>

									<p className='font-medium'>Количество баллов:</p>
									<p>{award.totalPoints}</p>

									<p className='font-medium'>Описание:</p>
									<p>{award.text || 'Пусто'}</p>
								</div>
							</div>

							<Separator />

							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<Users className='w-4 h-4 mr-2' /> Ответственные
								</h4>

								<div className='grid grid-cols-[1fr_2fr] space-y-3 text-sm'>
									<p className='font-medium'>Преподаватель:</p>
									<p>
										{award.teacher ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${award.teacher.keycloakId}`}
											>
												{award.teacher.firstName} {award.teacher.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>

									<p className='font-medium'>Методист:</p>
									<p>
										{award.methodist ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${award.methodist.keycloakId}`}
											>
												{award.methodist.firstName} {award.methodist.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>
								</div>
							</div>

							<Separator />

							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<SearchCode className='w-4 h-4 mr-2' /> Подробности
								</h4>

								<div className='grid grid-cols-[1fr_2fr] space-y-3 text-sm'>
									<p className='font-medium'>Критерия оценок:</p>
									<p>{award.type.name || 'Пусто'}</p>

									<p className='font-medium'>Вариант:</p>
									<p>{award.variant.name || 'Пусто'}</p>

									<p className='font-medium'>Критерий:</p>
									<p className='font-semibold'>{award.criteria.name || 'Пусто'}</p>

									<p className='font-medium'>Количество баллов:</p>
									<p className='font-bold'>{award.criteria.points.join('-') || 'Пусто'}</p>
								</div>
							</div>
						</div>

						<SheetFooter className='mt-4'>
							<Button asChild className='w-full'>
								<Link href={`/kpi/${award.id}`}>Открыть полную страницу</Link>
							</Button>
							<SheetClose asChild>
								<Button variant='outline'>Закрыть</Button>
							</SheetClose>
						</SheetFooter>
					</>
				)}
			</SheetContent>
		</Sheet>
	)
}
