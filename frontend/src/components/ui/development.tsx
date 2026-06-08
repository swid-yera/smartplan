'use client'

import type { FC } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@shadcn'
import { useLocaleStore } from '@store'
import { Construction, Home, MoveLeft } from 'lucide-react'

import uiLocale from './locale.json'

export const Development: FC = () => {
	const router = useRouter()
	const locale = useLocaleStore((state) => state.locale)
	const t = uiLocale[locale] ?? uiLocale.ru

	return (
		<div className='relative flex min-h-[calc(100vh-6rem)] flex-1 items-center justify-center overflow-hidden px-6 py-16 text-center'>
			<div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_35%)]' />
			<div className='absolute left-1/4 top-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl' />
			<div className='absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl' />

			<div className='relative mx-auto flex w-full max-w-3xl flex-col items-center'>
				<div className='relative mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-amber-500/30 bg-amber-500/10 shadow-[0_24px_80px_-24px_rgba(245,158,11,0.55)]'>
					<Construction className='h-14 w-14 text-amber-600' />
				</div>

				<div className='space-y-4'>
					<div className='inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300'>
						{t.development.badge}
					</div>
					<h1 className='text-4xl font-black tracking-tight text-foreground sm:text-5xl'>{t.development.title}</h1>
					<p className='mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg'>
						{t.development.description}
					</p>
				</div>

				<div className='mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
					<Button asChild className='gap-2' size='lg'>
						<Link href='/'>
							<Home className='h-4 w-4' />
							{t.development.home}
						</Link>
					</Button>

					<Button className='gap-2' size='lg' variant='outline' onClick={() => router.back()}>
						<MoveLeft className='h-4 w-4' />
						{t.development.back}
					</Button>
				</div>

				<p className='mt-8 text-xs uppercase tracking-[0.24em] text-muted-foreground/60'>{t.development.caption}</p>
			</div>
		</div>
	)
}
