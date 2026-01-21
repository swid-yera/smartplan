'use client'

import type { FC, ReactNode } from 'react'

import { formatHours } from '@helpers'
import type { IDiscipline } from '@types'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'

interface IProps {
	disciplines: IDiscipline[]
	commentSlot?: ReactNode
}

export const DisciplineView: FC<IProps> = ({ disciplines = [], commentSlot }) => {
	const totalModuleHours = disciplines.reduce((acc, d) => acc + d.totalHours, 0)

	const semesterTotals = Array(8).fill(0)

	disciplines.forEach((discipline) => {
		discipline.semesters.forEach((semester, i) => {
			semesterTotals[i] += semester.totalHours || 0
		})
	})

	return (
		<Card>
			<CardHeader className='flex-row items-start justify-between gap-4'>
				<div>
					<CardTitle>Дисциплины и распределение часов</CardTitle>
					<CardDescription>
						Общее количество часов и распределение по семестрам для каждой дисциплины в модуле.
					</CardDescription>
				</div>
				{commentSlot}
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='align-bottom w-[35%] pb-2' rowSpan={3}>
									Код и название дисциплины
								</TableHead>
								<TableHead className='align-bottom text-center pb-2' rowSpan={3}>
									Общее количество <br /> часов в модуле
								</TableHead>
								<TableHead className='text-center' colSpan={8}>
									Из них по семестрам
								</TableHead>
							</TableRow>
							<TableRow>
								{Array.from({ length: 4 }, (_, i) => (
									<TableHead key={i} className='text-center border-r last:border-r-0' colSpan={2}>
										{i + 1} курс
									</TableHead>
								))}
							</TableRow>
							<TableRow>
								{Array.from({ length: 8 }, (_, i) => (
									<TableHead key={i} className='text-xs text-center border-r last:border-r-0 py-2'>
										{i + 1}
										<br />
										семестр
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{disciplines?.length > 0 ? (
								disciplines.map((discipline, disciplineIndex) => (
									<DisciplineRowView key={disciplineIndex} discipline={discipline} />
								))
							) : (
								<TableRow>
									<TableCell className='h-24 text-center text-muted-foreground' colSpan={10}>
										Дисциплины не добавлены.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						{disciplines?.length > 0 && (
							<TableFooter>
								<TableRow>
									<TableCell className='text-left font-bold'>Всего по модулю:</TableCell>
									<TableCell className='text-right font-bold'>{formatHours(totalModuleHours)}</TableCell>
									{semesterTotals.map((totalHours, i) => (
										<TableCell key={i} className='text-center font-bold border-r last:border-r-0'>
											<p>{totalHours > 0 ? `${totalHours}ч` : '—'}</p>
										</TableCell>
									))}
								</TableRow>
							</TableFooter>
						)}
					</Table>
				</div>
			</CardContent>
		</Card>
	)
}

const DisciplineRowView: FC<{ discipline: IDiscipline }> = ({ discipline }) => {
	return (
		<TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
			<TableCell>
				<p className='text-sm text-muted-foreground'>{discipline.name || '—'}</p>
			</TableCell>
			<TableCell className='align-middle text-center w-24 font-medium'>
				<p>{formatHours(discipline.totalHours)}</p>
			</TableCell>
			{discipline.semesters.map((semester, semesterIndex) => (
				<TableCell key={semesterIndex} className='align-middle text-center text-sm'>
					{semester.totalHours > 0 ? `${semester.totalHours}ч` : '—'}
				</TableCell>
			))}
		</TableRow>
	)
}
