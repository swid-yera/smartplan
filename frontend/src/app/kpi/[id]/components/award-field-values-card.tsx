'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import type { IAward } from '@types'

import { MediaViewer } from './media-viewer'

interface IAwardFieldValuesCardProps {
	award: IAward
}

export const AwardFieldValuesCard = ({ award }: IAwardFieldValuesCardProps) => {
	const awardFieldValues = Object.entries(award.fieldValues || {})

	return (
		<Card className='md:col-span-3'>
			<CardHeader>
				<CardTitle>Данные</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				<div>
					<h3 className='mb-2 font-semibold'>Поля категории</h3>
					{awardFieldValues.length ? (
						<div className='space-y-4'>
							{awardFieldValues.map(([fieldKey, rawValue]) => {
								const values = Array.isArray(rawValue) ? rawValue : [rawValue]
								const nonEmptyValues = values.filter((value) => {
									if (value === null || value === undefined) return false
									if (typeof value === 'number') return true
									if (typeof value === 'string') return value.trim().length > 0

									return false
								})
								const isFileField = fieldKey.toLowerCase() === 'file'

								return (
									<div key={fieldKey} className='space-y-2 rounded-md border p-3'>
										<p className='text-sm font-medium text-muted-foreground'>{fieldKey}</p>

										{nonEmptyValues.length === 0 ? (
											<p className='text-sm text-muted-foreground'>Пусто</p>
										) : (
											<div className='space-y-3'>
												{nonEmptyValues.map((value, idx) => {
													const normalizedValue = typeof value === 'number' ? String(value) : value

													if (isFileField) {
														return (
															<MediaViewer
																key={`${fieldKey}-${idx}`}
																fileUrl={normalizedValue}
																type={fieldKey}
															/>
														)
													}

													const isHttp = /^https?:\/\//i.test(normalizedValue)

													if (isHttp) {
														return (
															<a
																key={`${fieldKey}-${idx}`}
																className='block truncate max-w-[500px] text-sm hover:underline text-primary'
																href={normalizedValue}
																rel='noopener noreferrer'
																target='_blank'
															>
																{normalizedValue}
															</a>
														)
													}

													return (
														<p
															key={`${fieldKey}-${idx}`}
															className='text-sm whitespace-pre-wrap wrap-break-word'
														>
															{normalizedValue}
														</p>
													)
												})}
											</div>
										)}
									</div>
								)
							})}
						</div>
					) : (
						<div className='rounded-md bg-muted/50 p-4 text-sm text-muted-foreground'>
							Дополнительные поля отсутствуют
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
