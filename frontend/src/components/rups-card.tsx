'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import Link from 'next/link'

import { formatAsDash, formatHours, normalizeStudyForm } from '@helpers'
import { type IRup } from '@types'
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
import { BookOpen, ChevronLeft, ChevronRight, Clock, ComponentIcon, Users } from 'lucide-react'

import { Loader } from './loader'
import { StatusBadge } from './status-badge'

interface IRupsProps {
	rups: IRup[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	title: ReactNode
	description?: ReactNode
	isLoading: boolean
}

export const RupsCard: FC<IRupsProps> = ({
	rups,
	currentPage,
	totalPages,
	onPageChange,
	title,
	description,
	isLoading,
}) => {
	const [selectedRup, setSelectedRup] = useState<IRup | null>(null)
	const isExist = rups.length > 0 || !isLoading

	return (
		<>
			<Card>
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
									{/* Убрали колонку "Действия", так как кликаем по строке */}
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									rups.map((item) => <RupRow key={item.id} rup={item} onSelect={setSelectedRup} />)
								) : (
									<TableRow>
										<TableCell className='h-40 text-center' colSpan={5}>
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

interface IRupSheet {
	onSelect: (rup: IRup | null) => void
	rup: IRup | null
}

export const RupSheet: FC<IRupSheet> = ({ rup, onSelect }) => {
	return (
		<Sheet open={!!rup} onOpenChange={(open) => !open && onSelect(null)}>
			<SheetContent className='overflow-y-auto sm:max-w-md w-full'>
				{rup && (
					<>
						<SheetHeader>
							<SheetTitle className='mt-2'>
								{rup.name + ' '}
								<StatusBadge status={rup.status} />
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
									<StatusBadge status={rup.status} />

									{rup?.reason && (
										<>
											<p className='font-medium'>Причина отказа:</p>
											<p>{rup?.reason}</p>
										</>
									)}

									<p className='font-medium'>Наименование:</p>
									<p>{rup.name}</p>

									<p className='font-medium'>Форма обучения:</p>
									<p>{normalizeStudyForm(rup.studyForm)}</p>
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
										{rup.teacher ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${rup.teacher.keycloakId}`}
											>
												{rup.teacher.firstName} {rup.teacher.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>

									<p className='font-medium'>Методист:</p>
									<p>
										{rup.methodist ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${rup.methodist.keycloakId}`}
											>
												{rup.methodist.firstName} {rup.methodist.lastName}
											</Link>
										) : (
											'пусто'
										)}
									</p>
								</div>
							</div>

							{rup.groups[0] && (
								<>
									<Separator />

									<div className='space-y-3'>
										<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
											<ComponentIcon className='w-4 h-4 mr-2' /> Группа
										</h4>

										<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
											<p className='font-medium'>Называние:</p>
											<p>{rup.groups[0]?.name}</p>

											<p className='font-medium'>Курс:</p>
											<p>{rup.course}</p>

											<p className='font-medium'>Учебный год:</p>
											<p>{rup.studyYear}</p>

											<p className='font-medium'>Специальность:</p>
											<p>{rup.groups[0]?.specialty}</p>

											<p className='font-medium'>Квалификация:</p>
											<p>{rup.groups[0]?.qualification}</p>
										</div>
									</div>
								</>
							)}

							<Separator />

							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<Clock className='w-4 h-4 mr-2' /> Часы
								</h4>

								<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
									<p className='font-medium'>Всего часов:</p>
									<p>{formatHours(rup.totalHours)}</p>
								</div>
							</div>
						</div>

						<SheetFooter className='mt-4'>
							<Button asChild className='w-full'>
								<Link href={`/rups/${rup.id}`}>Открыть полную страницу</Link>
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
