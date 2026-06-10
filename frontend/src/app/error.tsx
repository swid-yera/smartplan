'use client'

import { useEffect } from 'react'

import Link from 'next/link'

import { PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { Button } from '@shadcn'
import { useLocaleStore } from '@store'
import { MoveLeft, RotateCcw, ServerCrash } from 'lucide-react'

import uiLocale from '../components/ui/locale.json'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(uiLocale, locale)

	useEffect(() => {
		// Здесь можно отправить ошибку в сервис аналитики (Sentry, LogRocket и т.д.)
		console.error(error)
	}, [error])

	return (
		<div className='container flex flex-1 flex-col gap-8 py-12 max-w-3xl w-full mx-auto px-2'>
			<PageTitle backHref='back' description={t.errors.serverDescription}>
				500
			</PageTitle>

			<div className='flex flex-col items-center justify-center gap-8 text-center'>
				<div className='relative flex items-center justify-center'>
					<div className='absolute inset-0 animate-ping rounded-full bg-destructive/10 opacity-75 duration-1000' />
					<div className='relative rounded-full bg-muted/30 p-8 ring-1 ring-border backdrop-blur-sm'>
						<ServerCrash className='h-20 w-20 text-destructive' />
					</div>
				</div>

				<div className='space-y-4 max-w-[600px]'>
					<h1 className='text-8xl font-black tracking-tighter text-foreground select-none'>500</h1>
					<h2 className='text-2xl font-semibold tracking-tight'>{t.errors.serverTitle}</h2>
					<p className='text-muted-foreground text-lg'>{t.errors.serverDescription}</p>
				</div>

				<div className='flex min-w-[200px] flex-col gap-4 sm:flex-row'>
					<Button className='gap-2' size='lg' onClick={() => reset()}>
						<RotateCcw className='h-4 w-4' />
						{t.errors.serverRetry}
					</Button>
					<Button asChild className='gap-2' size='lg' variant='outline'>
						<Link href='/'>
							<MoveLeft className='h-4 w-4' />
							{t.errors.serverHome}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
