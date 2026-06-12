'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { type IUser } from '@types'

import { RatingDistributionChart } from '../../components/rating-distribution-chart'
import { type RatingStatsChartItem, type RatingStatsTexts } from '../rating-stats.types'

interface IProps {
	baseTeachersCount: number
	chartData: RatingStatsChartItem[]
	filteredTeachers: IUser[]
	onPointClick: (teacher: RatingStatsChartItem) => void
	t: Pick<
		RatingStatsTexts,
		| 'distribution'
		| 'emptyDescription'
		| 'emptyTitle'
		| 'headerDescription'
		| 'noMatchesDescription'
		| 'noMatchesTitle'
	>
	valueLabel: string
	barColors: readonly string[]
}

export const RatingStatsDistributionCard = ({
	baseTeachersCount,
	barColors,
	chartData,
	filteredTeachers,
	onPointClick,
	t,
	valueLabel,
}: IProps) => {
	return (
		<Card>
			<CardHeader>
				<div className='flex flex-col gap-1'>
					<CardTitle>{t.distribution}</CardTitle>
					<CardDescription>{t.headerDescription}</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				{filteredTeachers.length > 0 ? (
					<RatingDistributionChart
						barColors={barColors}
						data={chartData}
						valueLabel={valueLabel}
						onPointClick={onPointClick}
					/>
				) : (
					<div className='flex min-h-72 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center'>
						<p className='text-base font-medium text-foreground'>
							{baseTeachersCount > 0 ? t.noMatchesTitle : t.emptyTitle}
						</p>
						<p className='max-w-md text-sm text-muted-foreground'>
							{baseTeachersCount > 0 ? t.noMatchesDescription : t.emptyDescription}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
