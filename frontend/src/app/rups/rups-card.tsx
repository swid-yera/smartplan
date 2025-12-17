import type { FC } from 'react'

import Link from 'next/link'

import type { IRupModule } from '@types'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'

import { statusLabels, statusVariants } from '@/helpers'

interface IRupsProps {
	rups: IRupModule[]
}

export const RupsCard: FC<IRupsProps> = ({ rups }) => {
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
							{rups.map((item) => {
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

							{rups.length === 0 && (
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
		</Card>
	)
}
