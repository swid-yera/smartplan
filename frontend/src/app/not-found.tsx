import type { NextPage } from 'next'
import Link from 'next/link'

import { Button } from '@ui'
import { FileQuestion, MoveLeft } from 'lucide-react'

const Page: NextPage = () => {
	return (
		<div className='container flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center'>
			<div className='relative flex items-center justify-center'>
				<div className='absolute inset-0 animate-ping rounded-full bg-primary/10 opacity-75 duration-1000' />
				<div className='relative rounded-full bg-muted/30 p-8 ring-1 ring-border backdrop-blur-sm'>
					<FileQuestion className='h-20 w-20 text-primary' />
				</div>
			</div>

			<div className='space-y-4 max-w-[600px]'>
				<h1 className='text-8xl font-black tracking-tighter text-foreground select-none'>404</h1>
				<h2 className='text-2xl font-semibold tracking-tight'>Страница не найдена</h2>
				<p className='text-muted-foreground text-lg'>
					Кажется, вы зашли слишком далеко. Этой страницы не существует в наших учебных планах.
				</p>
			</div>

			<div className='flex flex-col sm:flex-row gap-4 min-w-[200px]'>
				<Button asChild className='gap-2' size='lg'>
					<Link href='/'>
						<MoveLeft className='h-4 w-4' />
						На главную
					</Link>
				</Button>
				<Button asChild size='lg' variant='outline'>
					<Link href='/support'>Перейти в поддержку</Link>
				</Button>
			</div>
		</div>
	)
}

export default Page
