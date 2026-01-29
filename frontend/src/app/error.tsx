'use client'

import { useEffect } from 'react'

import Link from 'next/link'

import { Button } from '@shadcn'
import { MoveLeft, RotateCcw, ServerCrash } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		// Здесь можно отправить ошибку в сервис аналитики (Sentry, LogRocket и т.д.)
		console.error(error)
	}, [error])

	return (
		<div className='container flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center'>
			<div className='relative flex items-center justify-center'>
				<div className='absolute inset-0 animate-ping rounded-full bg-destructive/10 opacity-75 duration-1000' />
				<div className='relative rounded-full bg-muted/30 p-8 ring-1 ring-border backdrop-blur-sm'>
					<ServerCrash className='h-20 w-20 text-destructive' />
				</div>
			</div>

			<div className='space-y-4 max-w-[600px]'>
				<h1 className='text-8xl font-black tracking-tighter text-foreground select-none'>500</h1>
				<h2 className='text-2xl font-semibold tracking-tight'>Внутренняя ошибка сервера</h2>
				<p className='text-muted-foreground text-lg'>
					Что-то пошло не так. Мы уже уведомлены о проблеме и работаем над её решением. Попробуйте обновить
					страницу или вернуться позже.
				</p>
			</div>

			<div className='flex flex-col sm:flex-row gap-4 min-w-[200px]'>
				<Button className='gap-2' size='lg' onClick={() => reset()}>
					<RotateCcw className='h-4 w-4' />
					Попробовать снова
				</Button>
				<Button asChild className='gap-2' size='lg' variant='outline'>
					<Link href='/'>
						<MoveLeft className='h-4 w-4' />
						На главную
					</Link>
				</Button>
			</div>
		</div>
	)
}
