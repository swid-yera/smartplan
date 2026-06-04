'use client'

import type { FC } from 'react'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface IRatingDistributionPoint {
	keycloakId?: string
	name: string
	value: number
	departments?: string[]
}

interface IRatingDistributionChartProps {
	data: IRatingDistributionPoint[]
	valueLabel?: string
	height?: number
	hideXAxis?: boolean
	barColors?: readonly string[]
	onPointClick?: (point: IRatingDistributionPoint) => void
}

const BAR_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'] as const

interface IRatingDistributionTooltipProps {
	active?: boolean
	label?: string | number
	payload?: Array<{
		value?: number
		payload?: IRatingDistributionPoint
	}>
	valueLabel?: string
}

const RatingDistributionTooltip: FC<IRatingDistributionTooltipProps> = ({ active, payload, label, valueLabel }) => {
	if (!active || !payload?.length) return null

	const point = payload[0]?.payload
	const value = payload[0]?.value ?? point?.value ?? 0
	const departments = point?.departments ?? []

	return (
		<div className='max-w-xs rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md'>
			{label ? <p className='mb-1 font-medium'>{label}</p> : null}
			{departments.length > 0 ? (
				<p className='whitespace-normal wrap-break-word text-xs text-foreground'>{departments.join(', ')}</p>
			) : null}

			<div className='flex items-center gap-2 text-sm mt-2'>
				<span className='font-medium text-popover-foreground'>{valueLabel || 'Баллы'}:</span>
				<span className='font-semibold text-foreground'>{value}</span>
			</div>
		</div>
	)
}

export const RatingDistributionChart: FC<IRatingDistributionChartProps> = ({
	data,
	valueLabel,
	height = 300,
	hideXAxis = true,
	barColors = BAR_COLORS,
	onPointClick,
}) => {
	return (
		<div className='h-full w-full rounded-lg bg-muted/20 p-2'>
			<ResponsiveContainer height={height} width='100%'>
				<BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
					<CartesianGrid stroke='var(--border)' strokeDasharray='3 3' vertical={false} />
					<XAxis dataKey='name' hide={hideXAxis} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
					<YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={40} />
					<Tooltip
						content={<RatingDistributionTooltip valueLabel={valueLabel} />}
						cursor={{ fill: 'var(--accent)' }}
					/>
					<Bar dataKey='value' minPointSize={4} radius={[6, 6, 0, 0]}>
						{data.map((point, index) => (
							<Cell
								key={`${point.keycloakId ?? point.name}-${index}`}
								className={onPointClick ? 'cursor-pointer' : undefined}
								fill={barColors[index % barColors.length]}
								onClick={() => onPointClick?.(point)}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
