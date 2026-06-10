'use client'

import type { FC } from 'react'

import { getUILocaleSection } from '@helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tooltip, TooltipContent, TooltipTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { Info } from 'lucide-react'

import localeDictionary from '../locale.json'

interface IProps {
	currentPoints: number
}

export const UserKpiAwardsSummaryCard: FC<IProps> = ({ currentPoints }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).page

	return (
		<Card className='overflow-hidden'>
			<CardHeader className='flex flex-row items-start justify-between gap-2 space-y-0 pb-2'>
				<div className='min-w-0 space-y-0.5'>
					<CardTitle className='text-sm font-medium text-muted-foreground'>{t.kpiSummaryTitle}</CardTitle>
					<CardDescription className='text-xs leading-4'>{t.kpiSummaryDescription}</CardDescription>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<button
							aria-label={t.kpiSummaryTooltip}
							className='rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
							type='button'
						>
							<Info className='h-4 w-4' />
						</button>
					</TooltipTrigger>
					<TooltipContent className='max-w-xs text-sm'>{t.kpiSummaryTooltip}</TooltipContent>
				</Tooltip>
			</CardHeader>

			<CardContent className='pt-0'>
				<div className='flex items-end gap-2'>
					<p className='text-2xl font-semibold leading-none md:text-3xl'>{currentPoints}</p>
					<p className='pb-1 text-xs text-muted-foreground'>{t.kpiSummaryCurrent}</p>
				</div>
			</CardContent>
		</Card>
	)
}
