'use client'

import Link from 'next/link'

import { services } from '@services'
import { Button, Card, CardDescription, CardHeader, CardTitle, Heading } from '@shadcn'
import { useAuthStore } from '@store'
import { ArrowRightCircle, BarChart3, FileText, Loader2, LogIn } from 'lucide-react'

const features = [
	{
		icon: <FileText className='h-16 w-16 text-primary' />,
		title: 'Создание РУП',
		description:
			'SmartPlan использует искусственный интеллект для автоматического создания рабочих учебных программ, значительно сокращая время и усилия, необходимые для их разработки.',
		preview: '/trailer/rup-trailer.mov',
	},
	{
		icon: <BarChart3 className='h-16 w-16 text-primary' />,
		title: 'Система KPI и рейтинг',
		description:
			'Платформа включает систему KPI для объективной оценки эффективности преподавателей, формируя прозрачный рейтинг на основе их достижений и вклада в учебный процесс.',
		preview: '/trailer/kpi-trailer.mov',
	},
	{
		icon: <FileText className='h-16 w-16 text-primary' />,
		title: 'Создание плана учебного занятия',
		description:
			'SmartPlan использует искусственный интеллект для автоматического создания планов учебных занятий, значительно сокращая время и усилия, необходимые для их разработки.',
		preview: '/trailer/lesson-trailer.mov',
	},
]

const Page = () => {
	const { authLoading, isAuthenticated } = useAuthStore()

	const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
		const cardWrapper = e.currentTarget
		const videoPreview = cardWrapper.querySelector<HTMLDivElement>('.video-preview')
		const video = cardWrapper.querySelector('video')
		const loader = cardWrapper.querySelector<HTMLDivElement>('.video-loader')

		if (!videoPreview || !video) return

		const cardRect = cardWrapper.getBoundingClientRect()
		// Приблизительная высота всплывающего окна с видео
		const videoHeight = 320

		if (cardRect.top < videoHeight) {
			// Недостаточно места сверху, показать снизу
			videoPreview.classList.remove('bottom-full', 'mb-4')
			videoPreview.classList.add('top-full', 'mt-4')
		} else {
			// Достаточно места сверху, показать сверху (по умолчанию)
			videoPreview.classList.remove('top-full', 'mt-4')
			videoPreview.classList.add('bottom-full', 'mb-4')
		}

		if (loader) loader.classList.remove('opacity-0')
		video.currentTime = 0
		video.play().catch(console.error)
	}

	const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
		const video = e.currentTarget.querySelector('video')

		if (video) {
			video.pause()
		}
	}

	return (
		<section className='w-full py-12 md:py-24 lg:py-32 mx-auto'>
			<div className='flex flex-col items-center space-y-4 text-center'>
				<div className='space-y-2'>
					<Heading align='center' size='h1'>
						Добро пожаловать в SmartPlan
					</Heading>
					<p className='mx-auto max-w-[700px] text-muted-foreground md:text-xl'>
						Система создания и управления рабочими учебными программами с использованием ИИ, а также оценки
						преподавателей по KPI.
					</p>
				</div>
			</div>
			<div className='mx-auto mt-12 grid grid-cols-1 items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl'>
				{features.map((feature) => (
					<div
						key={feature.title}
						className='group relative h-full'
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
					>
						<div className='video-preview absolute bottom-full left-1/2 z-10 mb-4 invisible w-[500px] -translate-x-1/2 translate-y-2 rounded-lg border bg-background/80 backdrop-blur-md p-1 shadow-xl opacity-0 transition-all duration-300 group-hover:delay-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100'>
							<div className='video-loader absolute inset-1 z-10 flex items-center justify-center rounded bg-background/50 backdrop-blur-sm transition-opacity duration-300'>
								<Loader2 className='h-8 w-8 animate-spin text-primary' />
							</div>
							<video
								loop
								muted
								playsInline
								className='aspect-video w-full rounded bg-muted object-cover'
								src={feature.preview}
								onPlaying={(e) => {
									const loader = e.currentTarget.parentElement?.querySelector('.video-loader')

									if (loader) loader.classList.add('opacity-0')
								}}
								onWaiting={(e) => {
									const loader = e.currentTarget.parentElement?.querySelector('.video-loader')

									if (loader) loader.classList.remove('opacity-0')
								}}
							/>
						</div>
						<Card className='h-full transition-all group-hover:-translate-y-1 group-hover:shadow-lg'>
							<CardHeader className='flex flex-row items-start gap-4'>
								{feature.icon}
								<div className='grid gap-1'>
									<CardTitle>{feature.title}</CardTitle>
									<CardDescription>{feature.description}</CardDescription>
								</div>
							</CardHeader>
						</Card>
					</div>
				))}
			</div>
			<div className='mt-12 flex flex-col justify-center gap-2 min-[400px]:flex-row'>
				{!authLoading &&
					(isAuthenticated ? (
						<Button asChild size='lg'>
							<Link href='/dashboard'>
								Перейти к панель управлению <ArrowRightCircle />
							</Link>
						</Button>
					) : (
						<Button size='lg' onClick={() => services.auth.redirectToLogin()}>
							Войти в аккаунт <LogIn />
						</Button>
					))}
			</div>
		</section>
	)
}

export default Page
