'use client'

import { StatusBadge } from '@components'
import { formatCriteriaPoints, getCategoryIconOptionByName, getLocaleText, normalizeCriteriaMethod } from '@helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IAward, StatusEnum } from '@types'
import { BadgeInfo, Folder, Layers3, Sigma, Sparkles, Target } from 'lucide-react'

interface IAwardMainInfoCardProps {
	award: IAward
	labels: {
		typeLabel: string
		variantLabel: string
		criteriaLabel: string
		bonusCriteriaLabel: string
		methodLabel: string
		pointsLabel: string
		noBonusCriteria: string
	}
}

const detailItemClassName = 'rounded-lg border bg-muted/30 p-3'

export const AwardMainInfoCard = ({ award, labels }: IAwardMainInfoCardProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const typeName = getLocaleText(award.type.name, locale)
	const categoryName = award.category ? getLocaleText(award.category.name, locale) : ''
	const variantName = getLocaleText(award.variant.name, locale)
	const criteriaName = getLocaleText(award.criteria.name, locale)
	const bonusCriteriaName = award.bonus_criteria
		? getLocaleText(award.bonus_criteria.name, locale)
		: labels.noBonusCriteria
	const bonusCriteriaPoints = formatCriteriaPoints(award.bonus_criteria?.points ?? [])
	const criteriaPoints = formatCriteriaPoints(award.criteria.points)
	const categoryIconOption = getCategoryIconOptionByName(award.category?.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const title = categoryName || variantName || typeName
	const pointsText = award.status === StatusEnum.APPROVED ? `${award.totalPoints}` : '—'
	const pendingPointsText =
		locale === 'kk'
			? 'Ұпайлар әдіскер бекіткеннен кейін көрсетіледі.'
			: 'Баллы будут показаны после утверждения методистом.'

	return (
		<Card className='md:col-span-2'>
			<CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
				<div className='space-y-1'>
					<CardTitle className='flex items-center gap-2 text-xl font-bold'>
						<CategoryIcon className='h-5 w-5 text-primary' />
						<span>{title}</span>
					</CardTitle>
					<CardDescription className='flex flex-wrap items-center gap-2 text-sm'>
						<BadgeInfo className='h-4 w-4' />
						<span>{typeName}</span>
					</CardDescription>
				</div>
				<StatusBadge status={award.status} />
			</CardHeader>

			<CardContent className='space-y-4 pt-4'>
				<div className='grid gap-3 sm:grid-cols-2'>
					<div className={detailItemClassName}>
						<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
							{labels.typeLabel}
						</p>
						<p className='mt-2 flex items-center gap-2 text-sm font-medium'>
							<BadgeInfo className='h-4 w-4 text-primary' />
							<span>{typeName}</span>
						</p>
					</div>

					<div className={detailItemClassName}>
						<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
							{labels.variantLabel}
						</p>
						<p className='mt-2 flex items-center gap-2 text-sm font-medium'>
							<Layers3 className='h-4 w-4 text-primary' />
							<span>{variantName}</span>
						</p>
					</div>

					<div className={detailItemClassName}>
						<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
							{labels.criteriaLabel}
						</p>
						<p className='mt-2 flex items-center gap-2 text-sm font-medium'>
							<Target className='h-4 w-4 text-primary' />
							<span>{criteriaName}</span>
						</p>
						<p className='mt-1 text-xs text-muted-foreground'>
							{normalizeCriteriaMethod(award.criteria.method, award.criteria.points, locale)}{' '}
							{criteriaPoints ? `(${criteriaPoints})` : ''}
						</p>
					</div>

					<div className={detailItemClassName}>
						<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
							{labels.bonusCriteriaLabel}
						</p>
						<p className='mt-2 flex flex-wrap items-center gap-2 text-sm font-medium'>
							<Sparkles className='h-4 w-4 text-primary' />
							<span>{bonusCriteriaName}</span>
							{award.bonus_criteria && bonusCriteriaPoints ? (
								<span className='text-xs text-muted-foreground'>+{bonusCriteriaPoints}</span>
							) : null}
						</p>
					</div>

					<div className={detailItemClassName}>
						<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
							{labels.methodLabel}
						</p>
						<p className='mt-2 flex items-center gap-2 text-sm font-medium'>
							<Sigma className='h-4 w-4 text-primary' />
							<span>{normalizeCriteriaMethod(award.criteria.method, award.criteria.points, locale)}</span>
						</p>
					</div>

					<div className={detailItemClassName}>
						<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
							{labels.pointsLabel}
						</p>
						<p className='mt-2 text-3xl font-bold text-primary'>{pointsText}</p>
						{award.status !== StatusEnum.APPROVED ? (
							<p className='mt-1 text-xs text-muted-foreground'>{pendingPointsText}</p>
						) : null}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
