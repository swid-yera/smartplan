'use client'

import type { FC } from 'react'
import { useMemo, useState } from 'react'

import { Loader } from '@components'
import { getUILocaleSection } from '@helpers'
import { Card, CardContent } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IAward } from '@types'
import type { IAwardUserKpiSummaryResponse } from '@types'

import { AwardSheet } from '../../../../components/sheets/award-sheet'
import localeDictionary from '../locale.json'
import { useUserKpiAwardsCollapseState } from './use-user-kpi-awards-collapse'
import { UserKpiAwardsCategoryCard } from './user-kpi-awards-category-card'
import { UserKpiAwardsSummaryCard } from './user-kpi-awards-summary-card'

interface IProps {
	userId: string
	summary?: IAwardUserKpiSummaryResponse
	isLoading: boolean
}

export const UserKpiAwardsView: FC<IProps> = ({ userId, summary, isLoading }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).page
	const [selectedAward, setSelectedAward] = useState<IAward | null>(null)
	const categoryIds = useMemo(
		() => summary?.categories.map((category) => category.categoryId) ?? [],
		[summary?.categories],
	)
	const { collapsed, toggleCategory } = useUserKpiAwardsCollapseState(userId, categoryIds)

	if (isLoading) {
		return <Loader type='data' />
	}

	const currentPoints = summary?.currentPoints ?? 0
	const categories = summary?.categories ?? []

	return (
		<div className='space-y-4'>
			<UserKpiAwardsSummaryCard currentPoints={currentPoints} />

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
