'use client'

import type { ComponentProps, FC, PropsWithChildren, ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@lib'
import { Button, SidebarTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { ArrowLeft } from 'lucide-react'

import uiLocale from './locale.json'

interface IPageHeadingProps extends ComponentProps<'div'> {
	description?: ReactNode
	actions?: ReactNode
	backHref?: string
	sticky?: boolean
	top?: ReactNode
}

export const PageTitle: FC<PropsWithChildren<IPageHeadingProps>> = ({
	children,
	actions,
	description,
	className,
	backHref,
	sticky = false,
	...props
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = uiLocale[locale] ?? uiLocale.ru
	const stickyClassNames =
		'sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'

	return (
		<div
			className={cn('flex flex-col w-full space-y-2', className, {
				[stickyClassNames]: sticky,
				'px-4 py-4': sticky,
			})}
			data-rup-sticky-title={sticky ? 'true' : undefined}
			{...props}
		>
			<div className='flex items-center justify-between w-full space-x-4'>
				<h1 className='md:text-3xl text-xl w-full font-bold tracking-tight'>
					<SidebarTrigger className='inline-flex' type='button' /> {children}
				</h1>

				{actions}
			</div>
			<div className='flex justify-start items-center space-x-2'>
				{backHref && (
					<Button asChild size='sm' type='button' variant='outline'>
						<Link href={backHref}>
							<ArrowLeft />
							{t.pageTitle.back}
						</Link>
					</Button>
				)}

				<p className='text-muted-foreground md:text-base text-sm w-full'>{description}</p>
			</div>
		</div>
	)
}
