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

import { RupStatusBadge } from './rup-status-badge'

interface IRupsProps {
	rups: IRup[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	title: ReactNode
	description?: ReactNode
}

export const RupsCard: FC<IRupsProps> = ({ rups, currentPage, totalPages, onPageChange, title, description }) => {
	const [selectedRup, setSelectedRup] = useState<IRup | null>(null)

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
								{rups.map((item) => {
									return (
										<TableRow
											key={item.id}
											// Делаем строку интерактивной
											className='cursor-pointer hover:bg-muted/50 transition-colors'
											onClick={() => setSelectedRup(item)}
										>
											<TableCell className='font-medium whitespace-break-spaces min-w-[300px] py-4'>
												{item?.name || 'Без названия'}
											</TableCell>
											<TableCell className='whitespace-break-spaces min-w-[100px]'>
												{item?.teacher?.firstName || 'Неизвестно'}
											</TableCell>
											<TableCell className='whitespace-break-spaces min-w-[200px]'>
												{formatAsDash(item?.groups[0]?.specialty)}
											</TableCell>
											<TableCell className='whitespace-break-spaces min-w-[200px]'>
												{formatAsDash(item?.groups[0]?.qualification)}
											</TableCell>
											<TableCell>{formatAsDash(item?.studyYear)}</TableCell>
											<TableCell className='text-right'>
												<RupStatusBadge status={item.status} />
											</TableCell>
										</TableRow>
									)
								})}
								{rups.length === 0 && (
									<TableRow>
										<TableCell className='text-center' colSpan={6}>
											Пока нет ни одного модуля
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

			{/* Sheet Component остается прежним */}
			<Sheet open={!!selectedRup} onOpenChange={(open) => !open && setSelectedRup(null)}>
				<SheetContent className='overflow-y-auto sm:max-w-md w-full'>
					{selectedRup && (
						<>
							<SheetHeader>
								<SheetTitle className='mt-2'>
									{selectedRup.name + ' '}
									<RupStatusBadge status={selectedRup.status} />
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
										<RupStatusBadge status={selectedRup.status} />

										{selectedRup?.reason && (
											<>
												<p className='font-medium'>Причина отказа:</p>
												<p>{selectedRup?.reason}</p>
											</>
										)}

										<p className='font-medium'>Наименование:</p>
										<p>{selectedRup.name}</p>

										<p className='font-medium'>Форма обучения:</p>
										<p>{normalizeStudyForm(selectedRup.studyForm)}</p>
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
											{selectedRup.teacher ? (
												<Link
													className='hover:underline hover:text-primary font-semibold'
													href={`/users/${selectedRup.teacher.keycloakId}`}
												>
													{selectedRup.teacher.firstName} {selectedRup.teacher.lastName}
												</Link>
											) : (
												'пусто'
											)}
										</p>

										<p className='font-medium'>Методист:</p>
										<p>
											{selectedRup.methodist ? (
												<Link
													className='hover:underline hover:text-primary font-semibold'
													href={`/users/${selectedRup.methodist.keycloakId}`}
												>
													{selectedRup.methodist.firstName} {selectedRup.methodist.lastName}
												</Link>
											) : (
												'пусто'
											)}
										</p>
									</div>
								</div>

								{selectedRup.groups[0] && (
									<>
										<Separator />

										<div className='space-y-3'>
											<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
												<ComponentIcon className='w-4 h-4 mr-2' /> Группа
											</h4>

											<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
												<p className='font-medium'>Называние:</p>
												<p>{selectedRup.groups[0]?.name}</p>

												<p className='font-medium'>Курс:</p>
												<p>{selectedRup.course}</p>

												<p className='font-medium'>Учебный год:</p>
												<p>{selectedRup.studyYear}</p>

												<p className='font-medium'>Специальность:</p>
												<p>{selectedRup.groups[0]?.specialty}</p>

												<p className='font-medium'>Квалификация:</p>
												<p>{selectedRup.groups[0]?.qualification}</p>
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
										<p>{formatHours(selectedRup.totalHours)}</p>
									</div>
								</div>
							</div>

							<SheetFooter className='mt-4'>
								<Button asChild className='w-full'>
									<Link href={`/rups/${selectedRup.id}`}>Открыть полную страницу</Link>
								</Button>
								<SheetClose asChild>
									<Button variant='outline'>Закрыть</Button>
								</SheetClose>
							</SheetFooter>
						</>
					)}
				</SheetContent>
			</Sheet>
		</>
	)
}
