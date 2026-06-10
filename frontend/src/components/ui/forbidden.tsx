'use client'

import type { FC } from 'react'

import Link from 'next/link'

import { PageTitle } from '@components'
import { Button } from '@shadcn'
import { useLocaleStore } from '@store'
import { Home, MoveLeft, ShieldAlert } from 'lucide-react'

import uiLocale from './locale.json'

export const Forbidden: FC = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = uiLocale[locale] ?? uiLocale.ru

	return (
		<div className='container flex flex-1 flex-col gap-8 py-12 max-w-3xl w-full mx-auto px-2'>
			<PageTitle backHref='back' description={t.forbidden.description}>
				403
			</PageTitle>

			<div className='flex flex-col items-center justify-center gap-8 text-center'>
				{/* Иконка с анимацией */}
				<div className='relative flex items-center justify-center'>
					{/* Мягкое свечение сзади */}
					<div className='absolute inset-0 animate-pulse rounded-full bg-destructive/10 opacity-75 duration-2000' />
					<div className='relative rounded-full bg-muted/30 p-8 ring-1 ring-border backdrop-blur-sm'>
						<ShieldAlert className='h-20 w-20 text-destructive ' />
					</div>
				</div>

				{/* Текстовый блок */}
				<div className='space-y-4 max-w-[600px]'>
					<h1 className='text-8xl font-black tracking-tighter text-foreground select-none'>403</h1>
					<h2 className='text-3xl font-bold tracking-tight'>{t.forbidden.title}</h2>
					<p className='text-muted-foreground text-lg leading-relaxed'>{t.forbidden.description}</p>
				</div>

				{/* Кнопки действий */}
				<div className='flex min-w-[200px] flex-col gap-4 sm:flex-row'>
					<Button asChild className='gap-2' size='lg'>
						<Link href='/'>
							<Home className='h-4 w-4' />
							{t.forbidden.home}
						</Link>
					</Button>

					<Button asChild className='gap-2' size='lg' variant='outline'>
						<Link href='/'>
							<MoveLeft className='h-4 w-4' />
							{t.forbidden.back}
						</Link>
					</Button>
				</div>

				{/* Декоративный элемент (опционально) */}
				<div className='mt-8 flex items-center gap-2 text-xs text-muted-foreground/50 uppercase tracking-widest'>
					<span className='h-px w-8 bg-border' />
					{t.forbidden.caption}
					<span className='h-px w-8 bg-border' />
				</div>
			</div>
		</div>
	)
}
