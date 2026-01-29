import type { ComponentProps, FC } from 'react'

import { cn } from '@lib'
import { Spinner } from '@shadcn'
import { EthernetPort, FileText, Image as ImageIcon } from 'lucide-react'

interface IProps extends ComponentProps<'div'> {
	type?: 'file' | 'image' | 'data' | 'default'
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

	if (!fullScreen) {
		return (
			<div className={className} {...props}>
				{content}
				<p className='text-muted-foreground text-lg'>{message}</p>
			</div>
		)
	}

	return (
		<div
			className={cn('flex h-full w-full min-h-[200px] flex-col items-center justify-center', className)}
			{...props}
		>
			{content}
			<p className='text-muted-foreground text-lg'>{message}</p>
		</div>
	)
}
