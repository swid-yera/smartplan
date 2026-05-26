import type { FC } from 'react'

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
	const awardFields = Object.entries(award?.fieldValues || {}).flatMap(([fieldKey, rawValue]) => {
		const values = Array.isArray(rawValue) ? rawValue : [rawValue]

		return values
			.filter((value) => typeof value === 'string' && value.trim().length > 0)
			.map((value, index) => ({
				id: `${fieldKey}-${index}`,
				key: fieldKey,
				value: value.trim(),
			}))
	})

	return (
		<Sheet open={!!award} onOpenChange={(open) => !open && onSelect(null)}>
			<SheetContent className='overflow-y-auto sm:max-w-md w-full'>
				{award && (
					<>
						<SheetHeader>
							<SheetTitle className='mt-2'>
								{`${getLocaleText(award.variant.name, locale)}, ${getLocaleText(award.criteria.name, locale)} `}
								<StatusBadge status={award.status} />
							</SheetTitle>
							<SheetDescription>{t.award.description}</SheetDescription>
						</SheetHeader>

						<div className='grid flex-1 auto-rows-min gap-6 px-4'>
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
												href={`/users/${award.teacher.keycloakId}`}
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
												href={`/users/${award.methodist.keycloakId}`}
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

						<SheetFooter className='mt-4'>
							<Button asChild className='w-full'>
								<Link href={`/kpi/${award.id}`}>{t.openFullPage}</Link>
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
