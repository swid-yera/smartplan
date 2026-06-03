'use client'

import Link from 'next/link'

import { getLocaleText, getUILocaleSection } from '@helpers'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ILesson, ILessonResource } from '@types'
import type { Locale } from '@types'
import { Grid2X2, Link2 } from 'lucide-react'

import localeDictionary from './locale.json'

type IProps = {
	cardClassName: string
	lesson: ILesson
	lessonLocale: Locale
}

export function LessonResourcesGrid({ cardClassName, lesson, lessonLocale }: IProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<div className='grid gap-6 xl:grid-cols-2'>
			<Card className={cardClassName}>
				<CardHeader>
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
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
					<CardTitle className='inline-flex items-center gap-2 text-base sm:text-lg'>
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
		<div className='space-y-2'>
			<p className='text-xs uppercase tracking-wide text-muted-foreground'>{title}</p>
			<div className='rounded-xl border border-border/70 bg-muted/20 p-2'>
				{items.length ? (
					<ul className='divide-y divide-border/70'>
						{items.map((item, index) => (
							<li key={item.id} className='flex items-start gap-2 px-1 py-3 first:pt-1 last:pb-1'>
								<Badge className='mt-0.5 min-w-6' variant='secondary'>
									{index + 1}
								</Badge>
								<div className='space-y-1 text-sm'>
									<p className='font-medium'>{getLocaleText(item.name, locale) || empty}</p>
									{item.link ? (
										<Link
											className='inline-flex items-center gap-1 text-primary/90 transition-colors duration-150 hover:text-primary hover:underline'
											href={item.link}
											rel='noopener noreferrer'
											target='_blank'
										>
											<Link2 className='h-3.5 w-3.5 shrink-0' />
											{item.link}
										</Link>
									) : (
										<p className='text-xs text-muted-foreground'>{linkNotSpecified}</p>
									)}
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className='p-2 text-sm text-muted-foreground'>{empty}</p>
				)}
			</div>
		</div>
	)
}
