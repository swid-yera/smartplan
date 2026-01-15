'use client'

import { type FC, useState } from 'react'

import { AwardStatusBadge } from '@components'
import { awardCountDocument } from '@helpers'
import type { IAward } from '@types'
import {
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

import { AwardDetailsSheet } from './award-details-sheet'

interface IProps {
	className?: string
	awards: IAward[]
	isMethodist?: boolean
}

export const AwardsTable: FC<IProps> = ({ className, awards: data, isMethodist }) => {
	const [selectedAward, setSelectedAward] = useState<IAward | null>(null)

	return (
		<>
			<Card className={className}>
				<CardHeader>
					<CardTitle>Награды преподавателя</CardTitle>
				</CardHeader>

				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Статус</TableHead>
								<TableHead>Название</TableHead>
								<TableHead>Файлы</TableHead>
								<TableHead>Методист</TableHead>
								<TableHead>Преподаватель</TableHead>
								<TableHead>Дата</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{data.map((award) => (
								<TableRow
									key={award.id}
									className='cursor-pointer hover:bg-muted/50'
									onClick={() => setSelectedAward(award)}
								>
									<TableCell>
										<AwardStatusBadge status={award.status} />
									</TableCell>

									<TableCell className='font-medium'>{award.title}</TableCell>

									<TableCell>{awardCountDocument(award.images, award.document)} файл(а)</TableCell>

									<TableCell>{award.methodist?.name ?? '—'}</TableCell>

									<TableCell>{award.teacher.name}</TableCell>

									<TableCell>{award.createdAt}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<AwardDetailsSheet award={selectedAward} isMethodist={isMethodist} onClose={() => setSelectedAward(null)} />
		</>
	)
}
