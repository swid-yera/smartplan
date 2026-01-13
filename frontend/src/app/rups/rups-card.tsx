import type { FC } from 'react'

import Link from 'next/link'

import { statusLabels, statusVariants } from '@helpers'
import { type IRupModule } from '@types'
import {
	Badge,
	Button,
	Card,
	CardContent,
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

import { mockRupModules } from './mock.data'

interface IRupsProps {
	rups: IRupModule[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
}

export const RupsCard: FC<IRupsProps> = ({ rups, currentPage, totalPages, onPageChange }) => {
	const data = rups.length > 0 ? rups : mockRupModules

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					Список модулей РУП <u>"Almaty Polytech College"</u>
				</CardTitle>
			</CardHeader>

			<CardContent>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Наименование</TableHead>
								<TableHead>Специальность</TableHead>
								<TableHead>Квалификация</TableHead>
								<TableHead>Год</TableHead>
								<TableHead>Статус</TableHead>
								<TableHead className='text-right'>Действия</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{data.map((item) => {
								const status = item.status ?? 'DRAFT'
								const specialty = item.group.specialty ?? item.group.specialty

								return (
									<TableRow key={item.id}>
										<TableCell>{item.title || 'Без названия'}</TableCell>
										<TableCell>{specialty || '—'}</TableCell>
										<TableCell>{item.group.qualification || '—'}</TableCell>
										<TableCell>{item.year || '—'}</TableCell>
										<TableCell>
											<Badge variant={statusVariants[status] ?? 'default'}>
												{statusLabels[status] ?? status}{' '}
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

							{data.length === 0 && (
								<TableRow>
									<TableCell className='text-center' colSpan={6}>
										Пока нет ни одного модуля. Создайте первый.
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
