'use client'

import type { ComponentProps, FC } from 'react'

import { cn } from '@lib'
import { Spinner } from '@shadcn'
import { useLocaleStore } from '@store'
import { EthernetPort, FileText, Image as ImageIcon, Sparkles } from 'lucide-react'

import uiLocale from './locale.json'

interface IProps extends ComponentProps<'div'> {
	type?: 'file' | 'image' | 'data' | 'default' | 'ai'
	fullScreen?: boolean
}

export const Loader: FC<IProps> = ({ type = 'default', className, fullScreen = true, ...props }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = uiLocale[locale] ?? uiLocale.ru

	let content
	let message

	switch (type) {
		case 'file':
			content = <FileText className='size-10 text-muted-foreground animate-pulse' />
			message = t.loader.file
			break
		case 'image':
			content = <ImageIcon className='size-10 text-muted-foreground animate-bounce' />
			message = t.loader.image
			break
		case 'ai':
			content = <Sparkles className='size-10 text-purple-500 animate-pulse' />
			message = t.loader.ai
			break
		case 'data':
			content = <EthernetPort className='size-10 text-primary animate-bounce' />
			message = t.loader.data
			break
		case 'default':
		default:
			content = <Spinner className='size-10 text-primary' />
			message = t.loader.default
			break
	}

	const containerClasses = cn(
		'flex flex-col items-center justify-center gap-3',
		fullScreen && 'h-full w-full min-h-[200px]',
		className,
	)

	return (
		<div className={containerClasses} {...props}>
			{content}
			<p className='text-muted-foreground text-lg font-medium'>{message}</p>
		</div>
	)
}
