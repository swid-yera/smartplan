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
								const nonEmptyValues = values.filter((value) => value && value.trim())
								const isFileField = fieldKey.toLowerCase() === 'file'

								return (
									<div key={fieldKey} className='space-y-2 rounded-md border p-3'>
										<p className='text-sm font-medium text-muted-foreground'>{fieldKey}</p>

										{nonEmptyValues.length === 0 ? (
											<p className='text-sm text-muted-foreground'>Пусто</p>
										) : (
											<div className='space-y-3'>
												{nonEmptyValues.map((value, idx) => {
													if (isFileField) {
														return (
															<MediaViewer key={`${fieldKey}-${idx}`} fileUrl={value} type={fieldKey} />
														)
													}

													const isHttp = /^https?:\/\//i.test(value)

													if (isHttp) {
														return (
															<a
																key={`${fieldKey}-${idx}`}
																className='block truncate max-w-[500px] text-sm hover:underline text-primary'
																href={value}
																rel='noopener noreferrer'
																target='_blank'
															>
																{value}
															</a>
														)
													}

													return (
														<p
															key={`${fieldKey}-${idx}`}
															className='text-sm whitespace-pre-wrap wrap-break-word'
														>
															{value}
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
