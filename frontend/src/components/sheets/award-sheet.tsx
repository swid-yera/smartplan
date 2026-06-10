import { type FC, useRef } from 'react'

import Link from 'next/link'

import { getCategoryIconOptionByName, getLocaleText } from '@helpers'
import {
	Button,
	Separator,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IAward, StatusEnum } from '@types'
import { BookOpen, Download, FileText, Files, Folder, SearchCode, Users } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'

import { StatusBadge } from '../badges/status-badge'
import localeDictionary from './locale.json'

interface IAwardSheet {
	onSelect: (award: IAward | null) => void
	award: IAward | null
}

export const AwardSheet: FC<IAwardSheet> = ({ award, onSelect }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const openPageButtonRef = useRef<HTMLAnchorElement | null>(null)
	const totalPoints = award?.status !== StatusEnum.APPROVED ? t.award.pointsAfterApprove : award.totalPoints
	const category = award?.category ?? null
	const categoryName = category ? getLocaleText(category.name, locale) : ''
	const categoryDescription = category?.description ? getLocaleText(category.description, locale) : ''
	const categoryTypeNames =
		category?.awardTypesExpanded
			?.map((awardType) => getLocaleText(awardType.name, locale))
			.filter((name) => name.trim().length > 0) ?? []
	const categoryAwardTypesText = categoryTypeNames.length
		? categoryTypeNames.join(', ')
		: category?.awardTypes?.length
			? category.awardTypes.join(', ')
			: t.empty
	const categoryIconOption = getCategoryIconOptionByName(category?.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const categoryFields = category?.fieldsExpanded || []
	const categoryFieldByKey = new Map(categoryFields.map((field) => [field.key, field]))
	const awardFields = Object.entries(award?.fieldValues || {}).flatMap(([fieldKey, rawValue]) => {
		if (categoryFieldByKey.get(fieldKey)?.type === 'multi_fields') return []

		const values: unknown[] = Array.isArray(rawValue) ? rawValue : [rawValue]

		return values
			.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
			.map((value, index) => ({
				id: `${fieldKey}-${index}`,
				key: fieldKey,
				value: value.trim(),
			}))
	})
	const multiFieldSections = categoryFields
		.filter((field) => field.type === 'multi_fields')
		.map((field) => {
			const rawValue = award?.fieldValues?.[field.key]
			const subFields = Array.isArray(field.options)
				? field.options.filter(
						(option): option is { key: string; label: unknown; type: string } =>
							typeof option === 'object' && option !== null && 'key' in option && 'label' in option,
					)
				: []

			const rows = Array.isArray(rawValue)
				? rawValue
						.map((row) => {
							if (!row || typeof row !== 'object' || Array.isArray(row)) return null

							const normalizedRow: Record<string, string> = {}
							for (const subField of subFields) {
								const rowValue = row[subField.key]
								normalizedRow[subField.key] =
									typeof rowValue === 'number'
										? String(rowValue)
										: typeof rowValue === 'string'
											? rowValue.trim()
											: ''
							}

							return normalizedRow
						})
						.filter((row): row is Record<string, string> => !!row)
				: []

			return {
				fieldKey: field.key,
				fieldLabel: getLocaleText(field.label, locale) || field.key,
				rows,
				subFields,
			}
		})

	const renderMultiFieldValue = (value: unknown) => {
		if (typeof value === 'number') return String(value)
		if (typeof value === 'string') return value.trim()

		return t.empty
	}

	return (
		<Sheet open={!!award} onOpenChange={(open) => !open && onSelect(null)}>
			<SheetContent
				className='flex w-full flex-col sm:max-w-md'
				onOpenAutoFocus={(event) => {
					event.preventDefault()
					openPageButtonRef.current?.focus()
				}}
			>
				{award && (
					<>
						<SheetHeader className='px-4'>
							<SheetTitle className='mt-2'>
								{`${getLocaleText(award.variant.name, locale)}, ${getLocaleText(award.criteria.name, locale)} `}
								<StatusBadge status={award.status} />
							</SheetTitle>
							<SheetDescription>{t.award.description}</SheetDescription>
						</SheetHeader>

						<div className='flex-1 overflow-y-auto px-4'>
							<div className='grid auto-rows-min gap-6 pb-4'>
								<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<BookOpen className='w-4 h-4 mr-2' /> {t.main}
								</h4>

								<div className='grid grid-cols-[1fr_2fr] gap-2 text-sm'>
									<p className='font-medium'>{t.status}:</p>
									<StatusBadge status={award.status} />

									{award?.reason && (
										<>
											<p className='font-medium'>{t.rejectReason}:</p>
											<p>{award?.reason}</p>
										</>
									)}

									<p className='font-medium'>{t.award.criteria}:</p>
									<p>
										{getLocaleText(award.variant.name, locale)}, {getLocaleText(award.criteria.name, locale)}
									</p>

									<p className='font-medium'>{t.award.pointsLabel}:</p>
									<p>{totalPoints}</p>

									<p className='font-medium'>{t.award.textLabel}:</p>
									<p>{award.text || t.empty}</p>
								</div>
							</div>

								<Separator />

								<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<Users className='w-4 h-4 mr-2' /> {t.responsible}
								</h4>

								<div className='grid grid-cols-[1fr_2fr] space-y-3 text-sm'>
									<p className='font-medium'>{t.teacher}:</p>
									<p>
										{award.teacher ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${award.teacher.keycloakId}?tab=kpi`}
											>
												{award.teacher.firstName} {award.teacher.lastName}
											</Link>
										) : (
											t.empty
										)}
									</p>

									<p className='font-medium'>{t.methodist}:</p>
									<p>
										{award.methodist ? (
											<Link
												className='hover:underline hover:text-primary font-semibold'
												href={`/users/${award.methodist.keycloakId}?tab=kpi`}
											>
												{award.methodist.firstName} {award.methodist.lastName}
											</Link>
										) : (
											t.empty
										)}
									</p>
								</div>
							</div>

								<Separator />

								<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<SearchCode className='w-4 h-4 mr-2' /> {t.award.details}
								</h4>

								<div className='grid grid-cols-[1fr_2fr] space-y-3 text-sm'>
									<p className='font-medium'>{t.award.typeCriteria}:</p>
									<p>{getLocaleText(award.type.name, locale) || t.empty}</p>

									<p className='font-medium'>{t.award.variant}:</p>
									<p>{getLocaleText(award.variant.name, locale) || t.empty}</p>

									<p className='font-medium'>{t.award.criteria}:</p>
									<p className='font-semibold'>{getLocaleText(award.criteria.name, locale) || t.empty}</p>

									<p className='font-medium'>{t.award.criteriaPoints}:</p>
									<p className='font-bold'>{award.criteria.points.join('-') || t.empty}</p>
								</div>
							</div>

								<Separator />

								<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<CategoryIcon className='w-4 h-4 mr-2' /> {t.award.categoryDetails}
								</h4>

								<div className='grid grid-cols-[1fr_2fr] space-y-3 text-sm'>
									<p className='font-medium'>{t.award.categoryName}:</p>
									<div className='flex items-center gap-2'>
										<CategoryIcon className='h-4 w-4 text-primary' />
										<p>{categoryName || t.empty}</p>
									</div>

									<p className='font-medium'>{t.award.categoryDescription}:</p>
									<p>{categoryDescription || t.empty}</p>

									<p className='font-medium'>{t.award.categoryId}:</p>
									<p className='break-all'>{category?.id || award.categoryId || t.empty}</p>

									<p className='font-medium'>{t.award.categoryAwardTypes}:</p>
									<p>{categoryAwardTypesText}</p>
								</div>
							</div>

						<Separator />

						{multiFieldSections.length > 0 ? (
							<div className='space-y-3'>
								<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
									<Files className='w-4 h-4 mr-2' /> {t.award.multiFields}
								</h4>

								<div className='space-y-4'>
									{multiFieldSections.map(({ fieldKey, fieldLabel, rows, subFields }) => (
										<div key={fieldKey} className='space-y-3 rounded-md border p-3'>
											<p className='text-sm font-medium text-muted-foreground'>{fieldLabel}</p>

											{rows.length > 0 ? (
												<div className='space-y-3'>
													{rows.map((row, rowIndex) => (
														<div key={`${fieldKey}-${rowIndex}`} className='space-y-3 rounded-md bg-muted/30 p-3'>
															<p className='text-xs font-medium text-muted-foreground'>
																{t.award.multiFieldsRowTitle.replace('{index}', String(rowIndex + 1))}
															</p>
															<div className='grid gap-3 md:grid-cols-2'>
																{subFields.map((subField) => (
																	<div key={`${fieldKey}-${rowIndex}-${subField.key}`} className='space-y-1'>
																		<p className='text-xs font-medium text-muted-foreground'>
																			{getLocaleText(subField.label as Parameters<typeof getLocaleText>[0], locale) ||
																				subField.key}
																		</p>
																		<p className='text-sm break-all'>{renderMultiFieldValue(row[subField.key])}</p>
																	</div>
																))}
															</div>
														</div>
													))}
												</div>
											) : (
												<p className='text-sm text-muted-foreground'>{t.award.multiFieldsEmpty}</p>
											)}
										</div>
									))}
								</div>
							</div>
						) : null}

						<Separator />

						<div className='space-y-3'>
							<h4 className='font-medium text-sm text-muted-foreground flex items-center'>
								<Files className='w-4 h-4 mr-2' /> {t.award.documents}
							</h4>

								<div className='space-y-4'>
									{awardFields.length ? (
										awardFields.map((field) => {
											const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(field.value)
											const isLink = /^https?:\/\//i.test(field.value)

											if (isImage) {
												return (
													<div key={field.id} className='space-y-2 max-w-md'>
														<p className='text-xs text-muted-foreground'>{field.key}</p>
														<Zoom>
															<img
																alt='preview'
																className='cursor-zoom-in rounded-lg'
																height={300}
																src={field.value}
																width={400}
															/>
														</Zoom>
														<Button asChild size='sm' variant='outline'>
															<a
																download
																href={field.value}
																rel='noopener noreferrer'
																target='_blank'
															>
																<Download className='mr-2 h-4 w-4' />
																{t.award.download}
															</a>
														</Button>
													</div>
												)
											}

											if (isLink) {
												return (
													<div key={field.id} className='text-sm space-y-1'>
														<p className='text-xs text-muted-foreground'>{field.key}</p>
														<div className='flex items-center gap-2'>
															<FileText className='h-4 w-4 text-muted-foreground' />
															<a
																download
																className='truncate max-w-[300px] hover:underline text-primary'
																href={field.value}
																rel='noopener noreferrer'
																target='_blank'
															>
																{field.value}
															</a>
														</div>
													</div>
												)
											}

											return (
												<div key={field.id} className='text-sm space-y-1'>
													<p className='text-xs text-muted-foreground'>{field.key}</p>
													<p className='break-all'>{field.value}</p>
												</div>
											)
										})
									) : (
										<p className='text-sm text-muted-foreground'>{t.empty}</p>
									)}
								</div>
								</div>
							</div>
						</div>

						<SheetFooter className='mt-0 shrink-0 border-t bg-background px-4 py-4'>
							<Button asChild className='w-full'>
								<Link ref={openPageButtonRef} href={`/kpi/${award.id}`}>
									{t.openFullPage}
								</Link>
							</Button>
							<SheetClose asChild>
								<Button variant='outline'>{t.close}</Button>
							</SheetClose>
						</SheetFooter>
					</>
				)}
			</SheetContent>
		</Sheet>
	)
}
