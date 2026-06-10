'use client'

import type { NextPage } from 'next'
import Link from 'next/link'

import { PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { Button } from '@shadcn'
import { useLocaleStore } from '@store'
import { FileQuestion, MoveLeft } from 'lucide-react'

import uiLocale from '../components/ui/locale.json'

const Page: NextPage = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(uiLocale, locale)

	return (
		<div className='container flex flex-1 flex-col gap-8 py-12 max-w-3xl w-full mx-auto px-2'>
			<PageTitle backHref='back' description={t.errors.notFoundDescription}>
				404
			</PageTitle>

			<div className='flex flex-col items-center justify-center gap-8 text-center'>
				<div className='relative flex items-center justify-center'>
					<div className='absolute inset-0 animate-ping rounded-full bg-primary/10 opacity-75 duration-1000' />
					<div className='relative rounded-full bg-muted/30 p-8 ring-1 ring-border backdrop-blur-sm'>
						<FileQuestion className='h-20 w-20 text-primary' />
					</div>
				</div>

				<div className='space-y-4 max-w-[600px]'>
					<h1 className='text-8xl font-black tracking-tighter text-foreground select-none'>404</h1>
					<h2 className='text-2xl font-semibold tracking-tight'>{t.errors.notFoundTitle}</h2>
					<p className='text-muted-foreground text-lg'>{t.errors.notFoundDescription}</p>
				</div>

				<div className='flex min-w-[200px] flex-col gap-4 sm:flex-row'>
					<Button asChild className='gap-2' size='lg'>
						<Link href='/'>
							<MoveLeft className='h-4 w-4' />
							{t.errors.notFoundHome}
						</Link>
					</Button>
					<Button asChild size='lg' variant='outline'>
						<Link href='/support'>{t.errors.notFoundSupport}</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}

export default Page
