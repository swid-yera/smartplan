'use client'

import { type ElementType, type FC, useLayoutEffect, useRef, useState } from 'react'

import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

interface IStatusChart {
	data: {
		date: string
		approved: number
		review: number
		rejected: number
		in_progress: number
	}[]
}

const StatusChart: FC<IStatusChart> = ({ data }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState({ width: 0, height: 0 })

	useLayoutEffect(() => {
		if (containerRef.current) {
			const { width } = containerRef.current.getBoundingClientRect()

			setSize({ width: width * 0.8, height: width / 2 })
		}
	}, [])

	return (
		<div ref={containerRef} className='w-full h-auto'>
			{size.width > 0 && (
				<LineChart className='mx-auto' data={data} height={size.height} width={size.width}>
					<CartesianGrid strokeDasharray='3 3' />
					<XAxis dataKey='date' />
					<YAxis />
					<Tooltip content={<CustomTooltip />} />
					<Legend content={<CustomLegend />} />
					<Line
						dataKey='approved'
						dot={<ChartIconDot icon={CheckCircle} />}
						name='Одобрено'
						stroke='#22c55e'
						type='monotone'
					/>
					<Line
						dataKey='review'
						dot={<ChartIconDot icon={FileText} />}
						name='На проверке'
						stroke='#3b82f6'
						type='monotone'
					/>
					<Line
						dataKey='rejected'
						dot={<ChartIconDot icon={XCircle} />}
						name='Отклонено'
						stroke='#ef4444'
						type='monotone'
					/>
					<Line
						dataKey='in_progress'
						dot={<ChartIconDot icon={Clock} />}
						name='В процессе'
						stroke='#eab308'
						type='monotone'
					/>
				</LineChart>
			)}
		</div>
	)
}

export default StatusChart

interface CustomTooltipProps {
	active?: boolean
	payload?: { color: string; name: string; value: number }[]
	label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
	if (active && payload && payload.length) {
		return (
			<div className='bg-background border rounded-lg p-3 shadow-lg'>
				<p className='font-medium mb-2'>{label}</p>
				{payload.map((entry, index) => (
					<div key={index} className='flex items-center gap-2 text-sm'>
						<div className='w-2 h-2 rounded-full' style={{ backgroundColor: entry.color }} />
						<span className='text-muted-foreground'>{entry.name}:</span>
						<span className='font-medium'>{entry.value}</span>
					</div>
				))}
			</div>
		)
	}

	return null
}

const legendConfig: Record<string, ElementType> = {
	Одобрено: CheckCircle,
	'На проверке': FileText,
	Отклонено: XCircle,
	'В процессе': Clock,
}

interface CustomLegendProps {
	payload?: { value: string; color: string }[]
}

const CustomLegend = ({ payload }: CustomLegendProps) => {
	if (!payload) return null

	return (
		<div className='flex flex-wrap justify-center gap-4 pt-2'>
			{payload.map((entry, index) => {
				const Icon = legendConfig[entry.value]

				return (
					<div key={`item-${index}`} className='flex items-center gap-2 text-sm'>
						{Icon && <Icon className='w-4 h-4' style={{ color: entry.color }} />}
						<span className='text-muted-foreground'>{entry.value}</span>
					</div>
				)
			})}
		</div>
	)
}

interface ChartIconDotProps {
	cx?: number
	cy?: number
	stroke?: string
	icon: ElementType
}

const ChartIconDot = ({ cx, cy, stroke, icon: Icon }: ChartIconDotProps) => {
	if (cx === undefined || cy === undefined) return null

	return (
		<g>
			<circle cx={cx} cy={cy} fill='white' r={10} stroke={stroke} strokeWidth={1} />
			<Icon height={12} stroke={stroke} strokeWidth={2} width={12} x={cx - 6} y={cy - 6} />
		</g>
	)
}
