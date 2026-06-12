'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import Link from 'next/link'

import {
	getCategoryIconOptionByName,
	getLocaleText,
	getLocaleTextStrict,
	getUILocaleSection,
	hasAnyPermission,
} from '@helpers'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { type IAward, type Locale, PermissionCodeEnum } from '@types'
import { Folder, UserIcon } from 'lucide-react'

import { StatusBadge } from '../badges/status-badge'
import { AwardSheet } from '../sheets/award-sheet'
import { Loader } from '../ui/loader'
import { EmptyCard } from './empty-card'
import localeDictionary from './locale.json'

const capitalizeFirstLetter = (value: string) => {
	const trimmedValue = value.trim()

	if (!trimmedValue) return value

	return `${trimmedValue.charAt(0).toUpperCase()}${trimmedValue.slice(1)}`
}

const normalizePreviewValue = (value: unknown, locale: Locale, fieldType?: string) => {
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

		if (value.length > 0) {
			return `${value.length}`
		}

		return ''
	}

	if (typeof value === 'object') {
		const localizedText = getLocaleText(value as Parameters<typeof getLocaleText>[0], locale)

		return localizedText?.trim() || ''
	}

	return ''
}

const getAwardPreviewFields = (award: IAward, locale: Locale) => {
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

interface IProps {
	awards: IAward[]
	title: ReactNode
	description?: ReactNode
	isLoading: boolean
	showCreateOnEmpty?: boolean
	showPointsColumn?: boolean
}

export const AwardsCard: FC<IProps> = ({
	awards,
	title,
	description,
	isLoading,
	showCreateOnEmpty = false,
	showPointsColumn = true,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).awardsCard
	const [selectedAward, setSelectedAward] = useState<IAward | null>(null)
	const isExist = awards.length > 0 && !isLoading

	if (showCreateOnEmpty && !isExist && !isLoading) return <EmptyCard type='AWARD' />

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<div className='relative overflow-x-auto min-w-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t.createdAt}</TableHead>
									<TableHead>{t.teacher}</TableHead>
									<TableHead>{t.criteria}</TableHead>
									{showPointsColumn && <TableHead>{t.points}</TableHead>}
									<TableHead className='text-right'>{t.status}</TableHead>
									{/* Убрали колонку "Действия", так как кликаем по строке */}
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									awards.map((item) => (
										<AwardRow
											key={item.id}
											award={item}
											showPointsColumn={showPointsColumn}
											onSelect={setSelectedAward}
										/>
									))
								) : (
									<TableRow>
										<TableCell className='h-44 text-center' colSpan={showPointsColumn ? 5 : 4}>
											{isLoading ? (
												<Loader
													className='flex flex-col justify-center items-center'
													fullScreen={false}
													type='data'
												/>
											) : (
												t.empty
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<AwardSheet award={selectedAward} onSelect={(award) => setSelectedAward(award)} />
		</>
	)
}

interface IAwardRow {
	award: IAward
	onSelect: (award: IAward) => void
	showPointsColumn: boolean
}

const AwardRow: FC<IAwardRow> = ({ award, onSelect, showPointsColumn }) => {
	const locale = useLocaleStore((state) => state.locale)
	const me = useAuthStore((state) => state.user)
	const t = getUILocaleSection(localeDictionary, locale).awardsCard
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const teacherName = `${award?.teacher?.firstName} ${award?.teacher.lastName}`.trim() || t.unknownTeacher
	const canOpenTeacherKpi = hasAnyPermission(me, [
		PermissionCodeEnum.KPI_MANAGE,
		PermissionCodeEnum.RUP_MANAGE,
		PermissionCodeEnum.KPI_FULL,
		PermissionCodeEnum.RUP_FULL,
	])
	const categoryIconOption = getCategoryIconOptionByName(award.category?.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const criteriaSummary = `${getLocaleText(award.type.name, locale)} / ${getLocaleText(award.criteria.name, locale)}`
	const createdAt = new Date(award.createdAt).toLocaleDateString(dateLocale)
	const updatedAt = new Date(award.updatedAt).toLocaleString(dateLocale)
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
					<TableCell className='font-medium whitespace-nowrap w-21 min-w-21'>{createdAt}</TableCell>
					<TableCell className='font-medium whitespace-break-spaces min-w-25'>
						<div className='flex items-center gap-2'>
							<UserIcon className='h-4 w-4 text-muted-foreground' />
							{canOpenTeacherKpi && award.teacher?.keycloakId ? (
								<Link
									className='rounded-sm hover:text-primary hover:underline'
									href={`/users/${award.teacher.keycloakId}?tab=kpi`}
									onClick={(event) => event.stopPropagation()}
								>
									{teacherName}
								</Link>
							) : (
								<span>{teacherName}</span>
							)}
						</div>
					</TableCell>
					<TableCell className='font-medium whitespace-break-spaces min-w-25 py-4'>
						<div className='space-y-1'>
							<Link
								className='flex items-center gap-2 rounded-sm hover:text-primary hover:underline'
								href={`/kpi/${award.id}`}
								onClick={(event) => event.stopPropagation()}
							>
								<CategoryIcon className='h-4 w-4 shrink-0 text-primary' />
								<span>{criteriaSummary}</span>
							</Link>
							{previewFields.length > 0 && (
								<div className='flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground'>
									{previewFields.map((field) => (
										<span key={field.fieldKey} className='inline-flex min-w-0 gap-1'>
											<span className='whitespace-nowrap font-medium text-foreground/80'>
												{field.fieldLabel}:
											</span>
											<span className='min-w-0 max-w-40 break-all truncate'>{field.value}</span>
										</span>
									))}
								</div>
							)}
						</div>
					</TableCell>
					{showPointsColumn && <TableCell className='py-6'>{award.totalPoints || 0}</TableCell>}
					<TableCell className='text-right'>
						<StatusBadge status={award.status} />
					</TableCell>
				</TableRow>
			</TooltipTrigger>
			<TooltipContent side='top' sideOffset={8}>
				<div className='max-w-sm space-y-1'>
					<p className='text-sm'>
						{t.updatedAt}: <span className='font-medium'>{updatedAt}</span>
					</p>
					{award.reason && (
						<p className='text-sm'>
							{t.rejectReason}: <span className='font-medium'>{award.reason}</span>
						</p>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	)
}
