'use client'

import type { FC } from 'react'
import { useState } from 'react'

import { getLocaleText } from '@helpers'
import { cn } from '@lib'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { IAward, IReviewItem, IRup, ReviewEntityType } from '@types'
import { BookOpen, CheckCircle } from 'lucide-react'

import { StatusBadge } from '../badges/status-badge'
import { AwardSheet } from '../sheets/award-sheet'
import { RupSheet } from '../sheets/rup-sheet'
import { Loader } from '../ui/loader'

interface IProps {
	items: IReviewItem[]
	title?: string
	isLoading: boolean
	more?: number
	className?: string
}

export const CombineCard: FC<IProps> = ({ items, title, isLoading, more = 0, className }) => {
	const [selected, setSelected] = useState<IReviewItem | null>(null)
	const isExist = items.length > 0 && !isLoading

	return (
		<>
			<Card className={className}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>

				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[90px]'>Тип</TableHead>
								<TableHead>Наименование</TableHead>
								<TableHead>Преподаватель</TableHead>
								<TableHead className='text-right'>Дата изменений</TableHead>
								<TableHead className='text-right'>Статус</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{isExist ? (
								items.map((item) => <ReviewTableRow key={item.id} item={item} onSelect={setSelected} />)
							) : (
								<TableRow>
									<TableCell className='h-40 text-center' colSpan={6}>
										{isLoading ? (
											<Loader
												className='flex flex-col justify-center items-center'
												fullScreen={false}
												type='data'
											/>
										) : (
											'Пока нет ни одного модуля.'
										)}
									</TableCell>
								</TableRow>
							)}
							{isExist && !!more && (
								<TableRow>
									<TableCell className='h-40 text-center' colSpan={6}>
										Еще {more}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Sheets */}
			{selected?.type === 'RUP' && <RupSheet rup={selected.raw as IRup} onSelect={() => setSelected(null)} />}

			{selected?.type === 'AWARD' && (
				<AwardSheet award={selected.raw as IAward} onSelect={() => setSelected(null)} />
			)}
		</>
	)
}

// combine table row
interface IReviewTableRow {
	item: IReviewItem
	onSelect: (item: IReviewItem) => void
}

const ReviewTableRow: FC<IReviewTableRow> = ({ item, onSelect }) => {
	const locale = useLocaleStore((state) => state.locale)
	const teacherName =
		[item.teacher?.firstName, item.teacher?.lastName].filter(Boolean).join(' ').trim() ||
		item.teacher?.username ||
		item.teacher?.email ||
		'—'
	const fallbackTitle = item.title && !item.title.includes('[object Object]') ? item.title : ''
	const displayTitle = (() => {
		if (item.type !== 'AWARD') return fallbackTitle || 'Без названия'

		const award = item.raw as IAward
		const variantName = getLocaleText(award.variant?.name, locale)
		const criteriaName = getLocaleText(award.criteria?.name, locale)

		if (variantName && criteriaName) return `${variantName} / ${criteriaName}`
		if (variantName) return variantName
		if (criteriaName) return criteriaName

		return fallbackTitle || 'Без названия'
	})()

	return (
		<TableRow
			key={item.id}
			className='cursor-pointer hover:bg-muted/50 transition-colors'
			onClick={() => onSelect(item)}
		>
			<ReviewTypeCell type={item.type} />

			<TableCell className='font-medium py-5'>{displayTitle}</TableCell>

			<TableCell>{teacherName}</TableCell>

			<TableCell className='text-right text-xs text-muted-foreground'>
				{new Date(item.updatedAt).toLocaleDateString(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
				})}
			</TableCell>

			<TableCell className='text-right'>
				<StatusBadge status={item.status} />
			</TableCell>
		</TableRow>
	)
}

// combine type table cell
interface IReviewTypeCell {
	type: ReviewEntityType
}

const ReviewTypeCell: FC<IReviewTypeCell> = ({ type }) => {
	const config = typeConfig[type]
	const Icon = config.icon

	return (
		<TableCell className='w-[90px]'>
			<span className={cn('inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium', config.className)}>
				<Icon className='h-3.5 w-3.5' />
				{config.label}
			</span>
		</TableCell>
	)
}

// type config
const typeConfig = {
	RUP: {
		label: 'РУП',
		icon: BookOpen,
		className: 'text-blue-600 bg-blue-50',
	},
	AWARD: {
		label: 'KPI',
		icon: CheckCircle,
		className: 'text-green-600 bg-green-50',
	},
} as const
