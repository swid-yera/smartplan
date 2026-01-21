import type { FC, ReactNode } from 'react'

import Link from 'next/link'

import { rupStatusLabels, rupStatusVariants } from '@helpers'
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface IRupsProps {
	rups: IRup[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	title: ReactNode
	description?: ReactNode
}

export const RupsCard: FC<IRupsProps> = ({ rups, currentPage, totalPages, onPageChange, title, description }) => {
	return (
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
								<TableHead className='text-right'>Действия</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{rups.map((item) => {
								const status = item.status ?? 'DRAFT'
								const specialty = item.groups[0].specialty

								return (
									<TableRow key={item.id}>
										<TableCell>{item?.name || 'Без названия'}</TableCell>
										<TableCell>{item?.teacher?.firstName || 'Неизвестно'}</TableCell>
										<TableCell>{specialty || '—'}</TableCell>
										<TableCell>{item?.groups[0]?.qualification || '—'}</TableCell>
										<TableCell>{item?.studyYear || '—'}</TableCell>
										<TableCell className='text-right'>
											<Badge variant={rupStatusVariants[status] ?? 'default'}>
												{rupStatusLabels[status] ?? status}
											</Badge>
										</TableCell>
										<TableCell className='text-right'>
											<Button asChild size='sm' variant='outline'>
												<Link href={`/rups/${item.id}`}>Открыть</Link>
											</Button>
										</TableCell>
									</TableRow>
								)
							})}

							{rups.length === 0 && (
								<TableRow>
									<TableCell className='text-center' colSpan={7}>
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
	)
}
