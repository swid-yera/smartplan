'use client'

import Link from 'next/link'

import { getLocaleText, getUILocaleSection } from '@helpers'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import type { ILesson, ILessonResource, Locale } from '@types'
import { Grid2X2, Link2 } from 'lucide-react'

import localeDictionary from './locale.json'

type IProps = {
	cardClassName: string
	lesson: ILesson
	lessonLocale: Locale
}

export function LessonResourcesGrid({ cardClassName, lesson, lessonLocale }: IProps) {
	const t = getUILocaleSection(localeDictionary, lessonLocale)

	return (
		<div className='grid gap-4 sm:gap-6 xl:grid-cols-2'>
			<Card className={cardClassName}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base leading-tight sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<Link2 className='h-4 w-4' />
						</span>
						{t.resourcesOnlineTitle}
					</CardTitle>
					<CardDescription>{t.resourcesOnlineDescription}</CardDescription>
				</CardHeader>
				<CardContent>
					<ResourceList
						empty={t.empty}
						items={lesson.internet_resources}
						linkNotSpecified={t.linkNotSpecified}
						locale={lessonLocale}
						title={t.resourcesOnlineTitle}
					/>
				</CardContent>
			</Card>

			<Card className={cardClassName}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base leading-tight sm:text-lg'>
						<span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
							<Grid2X2 className='h-4 w-4' />
						</span>
						{t.resourcesOfflineTitle}
					</CardTitle>
					<CardDescription>{t.resourcesOfflineDescription}</CardDescription>
				</CardHeader>
				<CardContent>
					<ResourceList
						empty={t.empty}
						items={lesson.technical_resources}
						linkNotSpecified={t.linkNotSpecified}
						locale={lessonLocale}
						title={t.resourcesOfflineTitle}
					/>
				</CardContent>
			</Card>
		</div>
	)
}

function ResourceList({
	title,
	items,
	locale,
	empty,
	linkNotSpecified,
}: {
	title: string
	items: ILessonResource[]
	locale: 'ru' | 'kk'
	empty: string
	linkNotSpecified: string
}) {
	return (
		<div className='space-y-3'>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{title}</p>
			<div className='rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-2'>
				{items.length ? (
					<ul className='divide-y divide-border/70'>
						{items.map((item, index) => (
							<li
								key={item.id}
								className='flex min-w-0 flex-col gap-2 px-1 py-3 first:pt-1 last:pb-1 sm:flex-row sm:items-start sm:gap-2'
							>
								<Badge className='self-start sm:mt-0.5 sm:self-auto' variant='secondary'>
									{index + 1}
								</Badge>
								<div className='min-w-0 space-y-1 text-sm'>
									<p className='font-medium'>{getLocaleText(item.name, locale) || empty}</p>
									{item.link ? (
										<Link
											className='inline-flex max-w-full min-w-0 items-start gap-1 text-primary/90 transition-colors duration-150 hover:text-primary hover:underline'
											href={item.link}
											rel='noopener noreferrer'
											target='_blank'
										>
											<Link2 className='h-3.5 w-3.5 shrink-0' />
											<span className='break-all'>{item.link}</span>
										</Link>
									) : (
										<p className='text-xs text-muted-foreground'>{linkNotSpecified}</p>
									)}
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className='p-3 text-sm text-muted-foreground sm:p-2'>{empty}</p>
				)}
			</div>
		</div>
	)
}
