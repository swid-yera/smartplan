'use client'

import { type MouseEvent } from 'react'

import Link from 'next/link'

import { PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { ArrowRightCircle, BarChart3, FileText, Loader2, LogIn } from 'lucide-react'

import localeDictionary from './locale.json'

const features = [
	{
		key: 'rup',
		icon: <FileText className='h-8 w-8 text-primary' />,
		preview: '/trailer/rup-trailer.mov',
	},
	{
		key: 'kpi',
		icon: <BarChart3 className='h-8 w-8 text-primary' />,
		preview: '/trailer/kpi-trailer.mov',
	},
	{
		key: 'lesson',
		icon: <FileText className='h-8 w-8 text-primary' />,
		preview: '/trailer/lesson-trailer.mov',
	},
]

const HomePageClient = () => {
	const { authLoading, isAuthenticated } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
		const cardWrapper = event.currentTarget
		const videoPreview = cardWrapper.querySelector<HTMLDivElement>('.video-preview')
		const video = cardWrapper.querySelector('video')
		const loader = cardWrapper.querySelector<HTMLDivElement>('.video-loader')

		if (!videoPreview || !video) return

		const cardRect = cardWrapper.getBoundingClientRect()
		const videoHeight = 320

		if (cardRect.top < videoHeight) {
			videoPreview.classList.remove('bottom-full', 'mb-4')
			videoPreview.classList.add('top-full', 'mt-4')
		} else {
			videoPreview.classList.remove('top-full', 'mt-4')
			videoPreview.classList.add('bottom-full', 'mb-4')
		}

		videoPreview.classList.add('visible', 'opacity-100', 'translate-y-0')
		if (loader) loader.classList.remove('opacity-0')

		video.currentTime = 0
		video.play().catch(console.error)
	}

	const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
		const cardWrapper = event.currentTarget
		const videoPreview = cardWrapper.querySelector<HTMLDivElement>('.video-preview')
		const video = cardWrapper.querySelector('video')

		if (video) {
			video.pause()
		}

		if (videoPreview) {
			videoPreview.classList.remove('visible', 'opacity-100', 'translate-y-0')
		}
	}

	return (
		<section className='mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12'>
			<PageTitle description={t.pageDescription}>SmartPlan</PageTitle>

			<div className='mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:p-8'>
				<div className='flex flex-col gap-6'>
					<div className='max-w-3xl space-y-4'>
						<p className='text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground'>
							{t.heroEyebrow}
						</p>
						<p className='text-sm leading-7 text-muted-foreground sm:text-base'>{t.heroDescription}</p>
					</div>

					<div className='flex flex-col gap-3 sm:flex-row'>
						{authLoading ? (
							<Button disabled className='w-full sm:w-auto' size='lg'>
								<Loader2 className='h-4 w-4 animate-spin' />
								{t.actions.loading}
							</Button>
						) : isAuthenticated ? (
							<Button asChild className='w-full sm:w-auto' size='lg'>
								<Link href='/dashboard'>
									{t.actions.goDashboard}
									<ArrowRightCircle className='h-4 w-4' />
								</Link>
							</Button>
						) : (
							<Button className='w-full sm:w-auto' size='lg' onClick={() => services.auth.redirectToLogin()}>
								{t.actions.login}
								<LogIn className='h-4 w-4' />
							</Button>
						)}
					</div>

					<div className='flex flex-wrap gap-2'>
						{t.tags.map((item) => (
							<span
								key={item}
								className='rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground'
							>
								{item}
							</span>
						))}
					</div>
				</div>
			</div>

			<div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
				{features.map((feature) => {
					const featureLocale = t.features[feature.key]

					return (
						<div
							key={feature.key}
							className='group relative h-full'
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
						>
							<div className='video-preview invisible absolute bottom-full left-1/2 z-10 hidden w-[min(92vw,520px)] -translate-x-1/2 translate-y-2 rounded-2xl border border-border/70 bg-background/90 p-1 opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 md:block'>
								<div className='video-loader absolute inset-1 z-10 flex items-center justify-center rounded-[1.1rem] bg-background/50 backdrop-blur-sm transition-opacity duration-300'>
									<Loader2 className='h-8 w-8 animate-spin text-primary' />
								</div>
								<video
									loop
									muted
									playsInline
									className='aspect-video w-full rounded-2xl bg-muted object-cover'
									src={feature.preview}
									onPlaying={(event) => {
										const loader = event.currentTarget.parentElement?.querySelector('.video-loader')

										if (loader) loader.classList.add('opacity-0')
									}}
									onWaiting={(event) => {
										const loader = event.currentTarget.parentElement?.querySelector('.video-loader')

										if (loader) loader.classList.remove('opacity-0')
									}}
								/>
							</div>

							<Card className='h-full overflow-hidden border-border/60 bg-card/90 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md'>
								<CardHeader className='flex flex-row items-start gap-4 p-5 sm:p-6'>
									<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10'>
										{feature.icon}
									</div>
									<div className='grid gap-1'>
										<CardTitle className='text-base sm:text-lg'>{featureLocale.title}</CardTitle>
										<CardDescription className='text-sm leading-6'>
											{featureLocale.description}
										</CardDescription>
									</div>
								</CardHeader>
							</Card>
						</div>
					)
				})}
			</div>
		</section>
	)
}

export default HomePageClient
