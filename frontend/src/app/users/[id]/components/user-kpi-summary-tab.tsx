'use client'

import type { FC } from 'react'
import { useMemo, useState } from 'react'

import { Loader } from '@components'
import { getUILocaleSection } from '@helpers'
import { Badge, Card, CardContent } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IAwardUserKpiSummaryResponse } from '@types'
import { type IAward } from '@types'
import { BadgeCheck, Layers3 } from 'lucide-react'

import { AwardSheet } from '../../../../components/sheets/award-sheet'
import localeDictionary from '../locale.json'
import { useUserKpiAwardsCollapseState } from './use-user-kpi-awards-collapse'
import { UserKpiAwardsCategoryCard } from './user-kpi-awards-category-card'

interface IProps {
	isLoading: boolean
	summary?: IAwardUserKpiSummaryResponse
	userId: string
}

export const UserKpiSummaryTab: FC<IProps> = ({ isLoading, summary, userId }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).page
	const [selectedAward, setSelectedAward] = useState<IAward | null>(null)
	const categoryIds = useMemo(
		() => summary?.categories.map((category) => category.categoryId) ?? [],
		[summary?.categories],
	)
	const categories = summary?.categories ?? []
	const categoryCurrentPoints = categories.reduce((total, category) => total + (category.currentPoints || 0), 0)
	const categoryPendingPoints = categories.reduce((total, category) => total + (category.pendingPoints || 0), 0)
	const categoryTotalPoints = categoryCurrentPoints + categoryPendingPoints
	const { collapsed, toggleCategory } = useUserKpiAwardsCollapseState(userId, categoryIds)

	if (isLoading) {
		return <Loader type='data' />
	}

	return (
		<div className='space-y-4'>
			<div className='grid gap-3 md:grid-cols-2'>
				<div className='rounded-2xl border bg-muted/20 p-4'>
					<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						<BadgeCheck className='h-3.5 w-3.5 text-primary' />
						<span>{t.kpiSummaryCurrent}</span>
					</div>
					<div className='mt-3 flex items-end gap-2'>
						<Badge className='rounded-full px-3 py-1 text-sm font-semibold' variant='default'>
							{summary?.currentPoints ?? 0}
						</Badge>
						<span className='text-xs text-muted-foreground'>{t.kpiSummaryDescription}</span>
					</div>
				</div>

				<div className='rounded-2xl border bg-muted/20 p-4'>
					<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						<Layers3 className='h-3.5 w-3.5 text-primary' />
						<span>{t.kpiSummaryAllCategories}</span>
					</div>
					<div className='mt-3 flex items-end gap-2'>
						<Badge className='rounded-full px-3 py-1 text-sm font-semibold' variant='secondary'>
							{categoryTotalPoints}
						</Badge>
						<div className='space-y-1'>
							<span className='block text-xs text-muted-foreground'>{t.kpiSummaryAllCategoriesDescription}</span>
							<span className='block text-xs font-medium text-foreground/80'>
								{categoryCurrentPoints} + {categoryPendingPoints} = {categoryTotalPoints}
							</span>
						</div>
					</div>
				</div>
			</div>

			{categories.length > 0 ? (
				<div className='space-y-3'>
					{categories.map((category) => (
						<UserKpiAwardsCategoryCard
							key={category.categoryId}
							category={category}
							isCollapsed={collapsed[category.categoryId] ?? false}
							onSelectAward={setSelectedAward}
							onToggle={() => toggleCategory(category.categoryId)}
						/>
					))}
				</div>
			) : (
				<Card>
					<CardContent className='py-12 text-center text-sm text-muted-foreground'>{t.kpiAwardsEmpty}</CardContent>
				</Card>
			)}

			<AwardSheet award={selectedAward} onSelect={setSelectedAward} />
		</div>
	)
}
