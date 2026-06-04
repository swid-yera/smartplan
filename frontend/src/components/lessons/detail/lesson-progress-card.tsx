'use client'

import { getUILocaleSection } from '@helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import type { Locale } from '@types'
import { ListChecks } from 'lucide-react'

import type { INormalizedLessonProgress } from './lesson-page.types'
import { formatMinuteRange } from './lesson-page.utils'
import localeDictionary from './locale.json'

type IProps = {
	cardClassName: string
	lessonProgress: INormalizedLessonProgress[]
	lessonLocale: Locale
}

export function LessonProgressCard({ cardClassName, lessonLocale, lessonProgress }: IProps) {
	const t = getUILocaleSection(localeDictionary, lessonLocale)

	return (
		<Card className={cardClassName}>
			<CardHeader>
				<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
					<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
						<ListChecks className='h-4 w-4' />
					</span>
					{t.progressTitle}
				</CardTitle>
				<CardDescription>{t.progressDescription}</CardDescription>
			</CardHeader>
			<CardContent>
				{lessonProgress.length ? (
					<div className='overflow-hidden rounded-xl border border-border/70'>
						<div className='hidden border-b border-border/70 bg-muted/30 px-4 py-3 text-sm font-semibold md:grid md:grid-cols-[56px_minmax(240px,1fr)_2fr]'>
							<p className='text-center'>№</p>
							<p>{t.progressStage}</p>
							<p>{t.progressContent}</p>
						</div>

						<div className='divide-y divide-border/70'>
							{lessonProgress.map((item, index) => (
								<div key={item.id} className='p-4'>
									<div className='space-y-3 lg:hidden'>
										<div className='flex items-start gap-3'>
											<span className='inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-2 text-sm font-semibold'>
												{index + 1}
											</span>
											<div>
												<p className='font-semibold leading-snug'>{item.name || t.empty}</p>
												<p className='mt-1 text-xs text-muted-foreground'>
													{formatMinuteRange(item.firstTime, item.secondTime, item.thirdTime)}
												</p>
											</div>
										</div>
										<div className='pl-10'>
											<div className='space-y-1 text-sm leading-6'>
												{item.content.length ? (
													item.content.map((line, lineIndex) => (
														<p key={`${item.id}-line-mobile-${lineIndex}`}>{line}</p>
													))
												) : (
													<p className='text-muted-foreground'>{t.empty}</p>
												)}
											</div>
										</div>
									</div>

									<div className='hidden gap-4 lg:grid lg:grid-cols-[56px_minmax(200px,1fr)_2fr]'>
										<p className='text-center text-sm font-semibold'>{index + 1}</p>
										<div>
											<p className='font-semibold leading-snug'>{item.name || t.empty}</p>
											<p className='mt-1 text-xs text-muted-foreground'>
												{formatMinuteRange(item.firstTime, item.secondTime, item.thirdTime)}
											</p>
										</div>
										<div className='space-y-1 text-sm leading-6'>
											{item.content.length ? (
												item.content.map((line, lineIndex) => (
													<p key={`${item.id}-line-desktop-${lineIndex}`}>{line}</p>
												))
											) : (
												<p className='text-muted-foreground'>{t.empty}</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<p className='text-sm text-muted-foreground'>{t.progressEmpty}</p>
				)}
			</CardContent>
		</Card>
	)
}
