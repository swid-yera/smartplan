'use client'

import type { FC } from 'react'

import type { IAwardUserKpiCategorySummaryResponse } from '@types'
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
import { type IAward } from '@types'
import { ChevronDown, Folder } from 'lucide-react'

import { UserKpiAwardsRow } from './user-kpi-awards-row'
import localeDictionary from '../locale.json'

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
							className='flex w-full items-center justify-between gap-3 text-left'
							type='button'
						>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<CategoryIcon className='h-4 w-4' />
								</div>
								<div className='min-w-0 space-y-1'>
									<CardTitle className='truncate text-base'>{categoryName}</CardTitle>
									<p className='text-xs text-muted-foreground'>
										{category.awards.length} {t.kpiCategoryAwardsCount}
									</p>
								</div>
							</div>

							<div className='flex items-center gap-2'>
								<Tooltip>
									<TooltipTrigger asChild>
										<Badge className='bg-primary text-primary-foreground' variant='default'>
											{category.currentPoints}
										</Badge>
									</TooltipTrigger>
									<TooltipContent>{t.kpiCategoryCurrentPoints}</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger asChild>
										<Badge className='bg-secondary text-secondary-foreground' variant='secondary'>
											+{category.pendingPoints}
										</Badge>
									</TooltipTrigger>
									<TooltipContent>{t.kpiCategoryPendingPoints}</TooltipContent>
								</Tooltip>

								<ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
							</div>
						</button>
					</CollapsibleTrigger>
				</CardHeader>

				<CollapsibleContent>
					<CardContent className='pt-0'>
						{category.awards.length > 0 ? (
							<div className='relative min-w-0 overflow-x-auto'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className='whitespace-nowrap'>{t.kpiAwardsTableDate}</TableHead>
											<TableHead>{t.kpiAwardsTableCriteria}</TableHead>
											<TableHead className='whitespace-nowrap'>{t.kpiAwardsTablePoints}</TableHead>
											<TableHead className='whitespace-nowrap text-right'>{t.kpiAwardsTableStatus}</TableHead>
											<TableHead className='whitespace-nowrap text-right'>{t.kpiAwardsTableActions}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{category.awards.map((award) => (
											<UserKpiAwardsRow key={award.id} award={award} onSelect={onSelectAward} />
										))}
									</TableBody>
								</Table>
							</div>
						) : (
							<div className='rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground'>
								{t.kpiCategoryEmpty}
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	)
}
