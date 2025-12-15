import type { FC } from 'react'

import Link from 'next/link'

import type { IRupModule } from '@types'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@ui'
import { Badge } from 'lucide-react'

interface IRupsProps {
	rups: IRupModule[]
}

export const Rups: FC<IRupsProps> = ({ rups }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-sm'>Список РУП колледжа</CardTitle>
			</CardHeader>

			<CardContent>
				<div className='overflow-x-auto'>
					<table className='min-w-full text-left text-sm'>
						<thead className='border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400'>
							<tr>
								<th className='px-2 py-2'>Наименование</th>
								<th className='px-2 py-2'>Специальность</th>
								<th className='px-2 py-2'>Квалификация</th>
								<th className='px-2 py-2'>Год</th>
								<th className='px-2 py-2'>Статус</th>
								<th className='px-2 py-2 text-right'>Действия</th>
							</tr>
						</thead>

						<tbody>
							{rups.map((item) => {
								const status = item.status ?? 'DRAFT'
								const specialty = item.group.specialty ?? item.group.specialty

								return (
									<tr
										key={item.id}
										className='border-b border-slate-100 text-sm last:border-0 dark:border-slate-800'
									>
										<td className='px-2 py-2'>{item.title || 'Без названия'}</td>
										<td className='px-2 py-2 text-xs text-slate-500 dark:text-slate-400'>
											{specialty || '—'}
										</td>
										<td className='px-2 py-2 text-xs text-slate-500 dark:text-slate-400'>
											{item.group.qualification || '—'}
										</td>
										<td className='px-2 py-2 text-xs text-slate-500 dark:text-slate-400'>
											{item.years || '—'}
										</td>
										<td className='px-2 py-2'>
											<Badge className={statusClasses[status] ?? 'bg-slate-100 text-slate-700'}>
												{statusLabels[status] ?? status}
											</Badge>
										</td>
										<td className='px-2 py-2 text-right'>
											<Button asChild size='sm' variant='outline'>
												<Link href={`/rup-college/${item.id}`}>Открыть</Link>
											</Button>
										</td>
									</tr>
								)
							})}

							{rups.length === 0 && (
								<tr>
									<td className='px-2 py-4 text-center text-xs text-slate-500 dark:text-slate-400' colSpan={6}>
										Пока нет ни одного РУП. Создайте первый.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	)
}

const statusLabels: Record<string, string> = {
	DRAFT: 'Черновик',
	IN_REVIEW: 'На согласовании',
	APPROVED: 'Утверждён',
}

const statusClasses: Record<string, string> = {
	DRAFT: 'bg-slate-100 text-slate-700 border border-slate-200',
	IN_REVIEW: 'bg-amber-100 text-amber-800 border border-amber-200',
	APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
}
