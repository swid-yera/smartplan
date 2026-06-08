'use client'

import type { ComponentProps, FC, PropsWithChildren, ReactNode } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAuthStore, useLocaleStore } from '@store'
import { RoleEnum } from '@types'
import { cn } from '@lib'
import { Button, SidebarTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shadcn'
import { ArrowLeft } from 'lucide-react'

import uiLocale from './locale.json'

interface IPageHeadingProps extends ComponentProps<'div'> {
	description?: ReactNode
	actions?: ReactNode
	backHref?: string | Record<RoleEnum, string>
	backLabel?: ReactNode
	sticky?: boolean
	top?: ReactNode
}

export const PageTitle: FC<PropsWithChildren<IPageHeadingProps>> = ({
	children,
	actions,
	description,
	className,
	backHref,
	backLabel,
	sticky = false,
	...props
}) => {
	const router = useRouter()
	const { user } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = uiLocale[locale] ?? uiLocale.ru
	const stickyClassNames =
		'sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
	const descriptionText = typeof description === 'string' ? description.trim() : null
	const shouldShowDescriptionTooltip = !!descriptionText && descriptionText.length > 90
	const resolvedBackHref = !backHref
		? undefined
		: typeof backHref === 'string'
			? backHref
			: user
				? backHref[user.role]
				: undefined

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
				<TooltipProvider delayDuration={200}>
					<h1 className='md:text-3xl text-xl flex min-w-0 flex-1 items-center gap-2 font-bold tracking-tight'>
						<SidebarTrigger className='shrink-0' type='button' />
						<Tooltip>
							<TooltipTrigger asChild>
								<span className='min-w-0 flex-1 truncate'>{children}</span>
							</TooltipTrigger>
							<TooltipContent side='bottom' sideOffset={8}>
								<p className='max-w-[min(90vw,48rem)] text-balance'>{children}</p>
							</TooltipContent>
						</Tooltip>
					</h1>
				</TooltipProvider>

				<div className='shrink-0'>{actions}</div>
			</div>
			<div className='flex w-full min-w-0 items-center gap-2'>
				{backHref === 'back' ? (
					<Button size='sm' type='button' variant='outline' onClick={() => router.back()}>
						<ArrowLeft />
						{backLabel || t.pageTitle.back}
					</Button>
				) : resolvedBackHref ? (
					<Button asChild size='sm' type='button' variant='outline'>
						<Link href={resolvedBackHref}>
							<ArrowLeft />
							{backLabel || t.pageTitle.back}
						</Link>
					</Button>
				) : null}

				{shouldShowDescriptionTooltip ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<p className='text-muted-foreground md:text-base text-sm min-w-0 flex-1 truncate'>
								{descriptionText}
							</p>
						</TooltipTrigger>
						<TooltipContent side='bottom' sideOffset={8}>
							<p className='max-w-[min(90vw,48rem)] text-balance'>{descriptionText}</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<p className='text-muted-foreground md:text-base text-sm min-w-0 flex-1'>{description}</p>
				)}
			</div>
		</div>
	)
}
