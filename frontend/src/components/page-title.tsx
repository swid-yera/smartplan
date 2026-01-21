import type { ComponentProps, FC, PropsWithChildren, ReactNode } from 'react'

import { cn } from '@lib'
import { SidebarTrigger } from '@ui'

interface IPageHeadingProps extends ComponentProps<'div'> {
	description?: ReactNode
	actions?: ReactNode
}

export const PageTitle: FC<PropsWithChildren<IPageHeadingProps>> = ({
	children,
	actions,
	description,
	className,
	...props
}) => {
	return (
		<div className={cn('flex flex-col w-full', className)} {...props}>
			{actions}
			<h1 className='md:text-3xl text-xl w-full font-bold tracking-tight'>
				<SidebarTrigger className='inline-flex' type='button' /> {children}
			</h1>
			<p className='text-muted-foreground md:text-base text-sm w-full'>{description}</p>
		</div>
	)
}
