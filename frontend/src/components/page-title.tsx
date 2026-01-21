import type { ComponentProps, FC, PropsWithChildren, ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@lib'
import { Button, SidebarTrigger } from '@ui'
import { ArrowLeft } from 'lucide-react'

interface IPageHeadingProps extends ComponentProps<'div'> {
	description?: ReactNode
	actions?: ReactNode
	backHref?: string
}

export const PageTitle: FC<PropsWithChildren<IPageHeadingProps>> = ({
	children,
	actions,
	description,
	className,
	backHref,
	...props
}) => {
	return (
		<div className={cn('flex flex-col w-full space-y-2', className)} {...props}>
			<div className='flex items-center justify-between w-full space-x-4'>
				<h1 className='md:text-3xl text-xl w-full font-bold tracking-tight'>
					<SidebarTrigger className='inline-flex' type='button' /> {children}
				</h1>

				{actions}
			</div>
			<div className='flex justify-start items-center space-x-2'>
				{backHref && (
					<Button asChild size='icon' type='button' variant='outline'>
						<Link href={backHref}>
							<ArrowLeft />
						</Link>
					</Button>
				)}

				<p className='text-muted-foreground md:text-base text-sm w-full'>{description}</p>
			</div>
		</div>
	)
}
