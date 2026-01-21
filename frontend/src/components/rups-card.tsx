import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import Link from 'next/link'

import { normalizeRupType, normalizeStudyForm, rupStatusLabels, rupStatusVariants } from '@helpers'
import { type IRup } from '@types'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	RupStatusBadge,
	Sheet,
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
import { BookOpen, Calendar, ChevronLeft, ChevronRight, FileText, User } from 'lucide-react'

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
									const status = item.status ?? 'DRAFT'
									const specialty = item.groups[0]?.specialty

									return (
										<TableRow
											key={item.id}
											// Делаем строку интерактивной
											className='cursor-pointer hover:bg-muted/50 transition-colors'
											onClick={() => setSelectedRup(item)}
										>
											<TableCell className='font-medium'>{item?.name || 'Без названия'}</TableCell>
											<TableCell>{item?.teacher?.firstName || 'Неизвестно'}</TableCell>
											<TableCell>{specialty || '—'}</TableCell>
											<TableCell>{item?.groups[0]?.qualification || '—'}</TableCell>
											<TableCell>{item?.studyYear || '—'}</TableCell>
											<TableCell className='text-right'>
												<Badge variant={rupStatusVariants[status] ?? 'default'}>
													{rupStatusLabels[status] ?? status}
												</Badge>
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
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div className='font-medium'>Тип:</div>
										<div>{normalizeRupType(selectedRup.type)}</div>
										<div className='font-medium'>Форма обучения:</div>
										<div>{normalizeStudyForm(selectedRup.studyForm)}</div>
										<div className='font-medium'>Курс:</div>
										<div>{selectedRup.course}</div>
										<div className='font-medium'>Учебный год:</div>
										<div>{selectedRup.studyYear}</div>
									</div>
								</div>

								<hr className='border-gray-100 dark:border-gray-800' />

								<div className='space-y-3'>
									<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
										<User className='w-4 h-4 mr-2' /> Ответственные
									</h4>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div className='font-medium'>Преподаватель:</div>
										<div>
											{selectedRup.teacher?.firstName} {selectedRup.teacher?.lastName}
										</div>
										{selectedRup.methodist && (
											<>
												<div className='font-medium'>Методист:</div>
												<div>
													{selectedRup.methodist.firstName} {selectedRup.methodist.lastName}
												</div>
											</>
										)}
									</div>
								</div>

								<hr className='border-gray-100 dark:border-gray-800' />

								<div className='space-y-3'>
									<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
										<Calendar className='w-4 h-4 mr-2' /> Часы
									</h4>
									<div className='grid grid-cols-2 gap-2 text-sm'>
										<div className='font-medium'>Всего часов:</div>
										<div>{selectedRup.totalHours} ч.</div>
									</div>
								</div>

								{selectedRup.explorationNote && (
									<div className='space-y-2'>
										<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
											<FileText className='w-4 h-4 mr-2' /> Цели и задачи
										</h4>
										<p className='text-sm text-muted-foreground line-clamp-4'>
											{selectedRup.explorationNote.goals ||
												selectedRup.explorationNote.summary ||
												'Описание отсутствует'}
										</p>
									</div>
								)}
							</div>

							<SheetFooter className='mt-4'>
								<Button asChild className='w-full'>
									<Link href={`/rups/${selectedRup.id}`}>Открыть полную страницу</Link>
								</Button>
							</SheetFooter>
						</>
					)}
				</SheetContent>
			</Sheet>
		</>
	)
}
