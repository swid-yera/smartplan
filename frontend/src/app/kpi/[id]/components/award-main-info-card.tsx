'use client'

import { StatusBadge } from '@components'
import { getCategoryIconOptionByName, getLocaleText, normalizeCriteriaMethod } from '@helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IAward, StatusEnum } from '@types'
import { Folder } from 'lucide-react'

interface IAwardMainInfoCardProps {
	award: IAward
}

export const AwardMainInfoCard = ({ award }: IAwardMainInfoCardProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const typeName = getLocaleText(award.type.name, locale)
	const categoryName = award.category ? getLocaleText(award.category.name, locale) : ''
	const criteriaName = getLocaleText(award.criteria.name, locale)
	const categoryIconOption = getCategoryIconOptionByName(award.category?.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const matchedTypeIcon = getCategoryIconOptionByName(typeName)
	const TypeIcon = matchedTypeIcon?.Icon || Folder
	const title = categoryName || getLocaleText(award.variant.name, locale)

	return (
		<Card className='md:col-span-2'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-xl font-bold flex items-center gap-2'>
					<CategoryIcon className='h-5 w-5 text-primary' />
					<span>{title}</span>
				</CardTitle>
				<StatusBadge status={award.status} />
			</CardHeader>
			<CardContent className='space-y-4 pt-4'>
				<div className='grid gap-4 sm:grid-cols-2 sm:[&>div:nth-child(odd)]:pr-4 sm:[&>div:nth-child(even)]:border-l sm:[&>div:nth-child(even)]:border-border/60 sm:[&>div:nth-child(even)]:pl-4'>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Тип критерия</p>
						<div className='flex items-center gap-2 text-base'>
							<TypeIcon className='h-4 w-4 text-primary' />
							<span>{typeName}</span>
						</div>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Метод оценки</p>
						<p className='text-base'>{normalizeCriteriaMethod(award.criteria.method, award.criteria.points)}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Критерий</p>
						<p className='text-base'>{criteriaName}</p>
					</div>
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Начисленные баллы</p>
						{award.status !== StatusEnum.APPROVED ? (
							<p className='text-base'>Баллы зачисляются после утверждений методиста</p>
						) : (
							<p className='text-2xl font-bold text-primary'>{award.totalPoints}</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
