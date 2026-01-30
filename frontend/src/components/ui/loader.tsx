import type { ComponentProps, FC } from 'react'

import { cn } from '@lib'
import { Spinner } from '@shadcn'
import { EthernetPort, FileText, Image as ImageIcon, Sparkles } from 'lucide-react'

interface IProps extends ComponentProps<'div'> {
	type?: 'file' | 'image' | 'data' | 'default' | 'ai'
	fullScreen?: boolean
}

export const Loader: FC<IProps> = ({ type = 'default', className, fullScreen = true, ...props }) => {
	let content
	let message

	switch (type) {
		case 'file':
			content = <FileText className='size-10 text-muted-foreground animate-pulse' />
			message = 'Загрузка файла...'
			break
		case 'image':
			content = <ImageIcon className='size-10 text-muted-foreground animate-bounce' />
			message = 'Загрузка изображения...'
			break
		case 'ai':
			content = <Sparkles className='size-10 text-purple-500 animate-pulse' />
			message = 'ИИ генерирует ответ...'
			break
		case 'data':
			content = <EthernetPort className='size-10 text-primary animate-bounce' />
			message = 'Загрузка данных...'
			break
		case 'default':
		default:
			content = <Spinner className='size-10 text-primary' />
			message = 'Загрузка...'
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
