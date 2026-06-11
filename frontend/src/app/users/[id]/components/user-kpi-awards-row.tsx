'use client'

import type { FC } from 'react'

import Link from 'next/link'

import { StatusBadge } from '@components'
import { getCategoryIconOptionByName, getLocaleText, getLocaleTextStrict, getUILocaleSection } from '@helpers'
import { Button, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IAward, StatusEnum } from '@types'
import { ArrowUpRight, Folder } from 'lucide-react'

import localeDictionary from '../locale.json'

interface IProps {
	award: IAward
	onSelect: (award: IAward) => void
}

const capitalizeFirstLetter = (value: string) => {
	const trimmedValue = value.trim()

	if (!trimmedValue) return value

	return `${trimmedValue.charAt(0).toUpperCase()}${trimmedValue.slice(1)}`
}

const normalizePreviewValue = (value: unknown, locale: 'ru' | 'kk', fieldType?: string) => {
	if (value === null || value === undefined) return ''

	if (typeof value === 'string') return value.trim()
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)

	if (Array.isArray(value)) {
		if (fieldType === 'multi_fields' && value.length > 0) {
			return String(value.length)
		}

		const normalizedItems = value.map((item) => normalizePreviewValue(item, locale)).filter((item) => item.length > 0)

		if (normalizedItems.length > 0) {
			const preview = normalizedItems.slice(0, 2).join(', ')

			return normalizedItems.length > 2 ? `${preview}…` : preview
		}

		return value.length > 0 ? String(value.length) : ''
	}

	if (typeof value === 'object') {
		const localizedText = getLocaleText(value as Parameters<typeof getLocaleText>[0], locale)

		return localizedText?.trim() || ''
	}

	return ''
}

const getAwardPreviewFields = (award: IAward, locale: 'ru' | 'kk') => {
	const categoryFields = award.category?.fieldsExpanded || []
	const labelByKey = new Map(
		categoryFields.map((field) => [field.key, capitalizeFirstLetter(getLocaleTextStrict(field.label, locale) || '')]),
	)
	const orderedKeys = categoryFields
		.filter((field) => field.type !== 'file' && field.type !== 'url')
		.map((field) => field.key)

	return orderedKeys
		.map((fieldKey) => {
			const categoryField = categoryFields.find((field) => field.key === fieldKey)

			if (categoryField?.type === 'file' || categoryField?.type === 'url') return null

			const value = normalizePreviewValue(award.fieldValues?.[fieldKey], locale, categoryField?.type)

			if (!value) return null

			return {
				fieldKey,
				fieldLabel: labelByKey.get(fieldKey) || '',
				value,
			}
		})
		.filter((field): field is { fieldKey: string; fieldLabel: string; value: string } => !!field)
		.slice(0, 4)
}

export const UserKpiAwardsRow: FC<IProps> = ({ award, onSelect }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).page
	const categoryIconOption = getCategoryIconOptionByName(award.category?.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const criteriaSummary = `${getLocaleText(award.type.name, locale)} / ${getLocaleText(award.criteria.name, locale)}`
	const displayPoints =
		award.status === StatusEnum.IN_REVIEW ? (award.criteria.points[0] ?? award.totalPoints) : award.totalPoints
	const createdAt = new Date(award.createdAt).toLocaleDateString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')
	const previewFields = getAwardPreviewFields(award, locale)

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<TableRow
					className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70'
					role='button'
					tabIndex={0}
					onClick={() => onSelect(award)}
					onKeyDown={(event) => {
						if (event.key !== 'Enter' && event.key !== ' ') return
						event.preventDefault()
						onSelect(award)
					}}
				>
					<TableCell className='whitespace-nowrap font-medium'>{createdAt}</TableCell>
					<TableCell className='py-4 align-top'>
						<div className='space-y-1'>
							<Link
								className='flex items-center gap-2 rounded-sm font-medium hover:text-primary hover:underline'
								href={`/kpi/${award.id}`}
								onClick={(event) => event.stopPropagation()}
							>
								<CategoryIcon className='h-4 w-4 shrink-0 text-primary' />
								<span>{criteriaSummary}</span>
							</Link>

							{previewFields.length > 0 ? (
								<div className='flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground'>
									{previewFields.map((field) => (
										<span key={field.fieldKey} className='inline-flex min-w-0 gap-1'>
											<span className='font-medium text-foreground/80'>{field.fieldLabel}:</span>
											<span className='truncate'>{field.value}</span>
										</span>
									))}
								</div>
							) : null}
						</div>
					</TableCell>
					<TableCell className='whitespace-nowrap font-medium'>
						{award.status === StatusEnum.IN_REVIEW ? `+${displayPoints}` : displayPoints}
					</TableCell>
					<TableCell className='text-right'>
						<StatusBadge className='shrink-0' status={award.status} />
					</TableCell>
					<TableCell className='text-right'>
						<Button asChild size='icon-sm' variant='ghost' onClick={(event) => event.stopPropagation()}>
							<Link href={`/kpi/${award.id}`} title={t.kpiOpenAward}>
								<ArrowUpRight className='h-4 w-4' />
							</Link>
						</Button>
					</TableCell>
				</TableRow>
			</TooltipTrigger>
			<TooltipContent side='top' sideOffset={8}>
				<div className='max-w-sm space-y-1'>
					<p className='text-sm'>
						{t.kpiAwardUpdatedAt}:{' '}
						<span className='font-medium'>
							{new Date(award.updatedAt).toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU')}
						</span>
					</p>
					{award.reason ? (
						<p className='text-sm'>
							{t.kpiAwardRejectReason}: <span className='font-medium'>{award.reason}</span>
						</p>
					) : null}
				</div>
			</TooltipContent>
		</Tooltip>
	)
}
