'use client'

import type { FC } from 'react'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface IRatingDistributionPoint {
	name: string
	value: number
}

interface IRatingDistributionChartProps {
	data: IRatingDistributionPoint[]
	valueLabel?: string
	height?: number
	hideXAxis?: boolean
}

const BAR_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'] as const

export const RatingDistributionChart: FC<IRatingDistributionChartProps> = ({
	data,
	valueLabel,
	height = 300,
	hideXAxis = true,
}) => {
	return (
		<div className='h-full w-full rounded-lg bg-muted/20 p-2'>
			<ResponsiveContainer height={height} width='100%'>
				<BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
					<CartesianGrid stroke='var(--border)' strokeDasharray='3 3' vertical={false} />
					<XAxis dataKey='name' hide={hideXAxis} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
					<YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={40} />
					<Tooltip
						contentStyle={{
							background: 'var(--card)',
							border: '1px solid var(--border)',
							borderRadius: '0.5rem',
							color: 'var(--card-foreground)',
						}}
						cursor={{ fill: 'var(--accent)' }}
						formatter={(value) => [value, valueLabel || 'Value']}
					/>
					<Bar dataKey='value' radius={[6, 6, 0, 0]}>
						{data.map((point, index) => (
							<Cell key={`${point.name}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
