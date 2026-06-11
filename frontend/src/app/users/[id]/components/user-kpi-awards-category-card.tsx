'use client'

import type { FC } from 'react'

import { getCategoryIconOptionByName, getLocaleText, getUILocaleSection } from '@helpers'
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { IAwardUserKpiCategorySummaryResponse } from '@types'
import { type IAward, StatusEnum } from '@types'
import { BadgeCheck, ChevronDown, Clock3, Folder } from 'lucide-react'

import localeDictionary from '../locale.json'
import { UserKpiAwardsRow } from './user-kpi-awards-row'

interface IProps {
	category: IAwardUserKpiCategorySummaryResponse
	isCollapsed: boolean
	onToggle: () => void
	onSelectAward: (award: IAward) => void
}

export const UserKpiAwardsCategoryCard: FC<IProps> = ({ category, isCollapsed, onToggle, onSelectAward }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).page
	const categoryName = category.category ? getLocaleText(category.category.name, locale) : t.kpiCategoryUnknown
	const categoryIconOption = getCategoryIconOptionByName(category.category?.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const visibleAwards = category.awards.filter((award) => award.status !== StatusEnum.APPROVED)

	return (
		<Card className='overflow-hidden'>
			<Collapsible
				open={!isCollapsed}
				onOpenChange={(open) => {
					if (open !== !isCollapsed) {
						onToggle()
					}
				}}
			>
				<CardHeader className='pb-3'>
					<CollapsibleTrigger asChild>
						<button
							aria-label={isCollapsed ? t.kpiCategoryExpand : t.kpiCategoryCollapse}
							className='flex w-full flex-col gap-4 text-left md:flex-row md:items-start md:justify-between'
							type='button'
						>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<CategoryIcon className='h-4 w-4' />
								</div>
								<div className='min-w-0 space-y-1'>
									<CardTitle className='truncate text-base'>{categoryName}</CardTitle>
									<p className='text-xs text-muted-foreground'>
										{visibleAwards.length} {t.kpiCategoryUnderReviewCount}
									</p>
								</div>
							</div>

							<div className='flex flex-col items-start gap-2 md:items-end'>
								<div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
									<BadgeCheck className='h-3.5 w-3.5 text-primary' />
									<span>{t.kpiCategoryPointsSummary}</span>
								</div>

								<div className='flex flex-wrap items-center gap-2'>
									<Tooltip>
										<TooltipTrigger asChild>
											<Badge
												className='gap-1.5 rounded-full px-3 py-1 bg-primary text-primary-foreground'
												variant='default'
											>
												<BadgeCheck className='h-3.5 w-3.5' />
												<span>{category.currentPoints}</span>
											</Badge>
										</TooltipTrigger>
										<TooltipContent>{t.kpiCategoryCurrentPoints}</TooltipContent>
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Badge className='gap-1.5 rounded-full px-3 py-1' variant='secondary'>
												<Clock3 className='h-3.5 w-3.5' />
												<span>+{category.pendingPoints}</span>
											</Badge>
										</TooltipTrigger>
										<TooltipContent>{t.kpiCategoryPendingPoints}</TooltipContent>
									</Tooltip>
								</div>

								<ChevronDown
									className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'} md:self-end`}
								/>
							</div>
						</button>
					</CollapsibleTrigger>
				</CardHeader>

				<CollapsibleContent>
					<CardContent className='pt-0'>
						{visibleAwards.length > 0 ? (
							<div className='relative min-w-0 overflow-x-auto'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='whitespace-nowrap'>{t.kpiAwardsTableDate}</TableHead>
											<TableHead>{t.kpiAwardsTableCriteria}</TableHead>
											<TableHead className='whitespace-nowrap'>{t.kpiAwardsTablePoints}</TableHead>
											<TableHead className='whitespace-nowrap text-right'>
												{t.kpiAwardsTableStatus}
											</TableHead>
											<TableHead className='whitespace-nowrap text-right'>
												{t.kpiAwardsTableActions}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{visibleAwards.map((award) => (
											<UserKpiAwardsRow key={award.id} award={award} onSelect={onSelectAward} />
										))}
									</TableBody>
								</Table>
							</div>
						) : (
							<div className='rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground'>
								{t.kpiCategoryEmptyUnderReview}
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	)
}
