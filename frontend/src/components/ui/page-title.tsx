'use client'

import type { ComponentProps, FC, PropsWithChildren, ReactNode } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { cn } from '@lib'
import { Button, SidebarTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { RoleEnum } from '@types'
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

	const renderBackButton = (className: string) => {
		if (!resolvedBackHref && backHref !== 'back') return null

		const backButtonContent = (
			<>
				<ArrowLeft />
				{backLabel || t.pageTitle.back}
			</>
		)

		return backHref === 'back' ? (
			<Button className={className} size='sm' type='button' variant='outline' onClick={() => router.back()}>
				{backButtonContent}
			</Button>
		) : resolvedBackHref ? (
			<Button asChild className={className} size='sm' type='button' variant='outline'>
				<Link href={resolvedBackHref}>{backButtonContent}</Link>
			</Button>
		) : null
	}

	return (
		<div
			className={cn('flex w-full flex-col gap-2', className, {
				[stickyClassNames]: sticky,
				'px-4 py-4': sticky,
			})}
			data-rup-sticky-title={sticky ? 'true' : undefined}
			{...props}
		>
			<div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] md:items-start'>
				<TooltipProvider delayDuration={200}>
					<h1 className='flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight md:text-3xl'>
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

				<div className='flex w-full items-center justify-end gap-2'>{actions}</div>
			</div>

			{renderBackButton('shrink-0 sm:hidden')}

			<div className='flex w-full flex-col gap-2 sm:flex-row sm:items-center'>
				{renderBackButton('shrink-0 max-sm:hidden')}
				{shouldShowDescriptionTooltip ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<p className='min-w-0 flex-1 truncate text-sm text-muted-foreground md:text-base'>
								{descriptionText}
							</p>
						</TooltipTrigger>
						<TooltipContent side='bottom' sideOffset={8}>
							<p className='max-w-[min(90vw,48rem)] text-balance'>{descriptionText}</p>
						</TooltipContent>
					</Tooltip>
				) : (
					<p className='min-w-0 flex-1 text-sm text-muted-foreground md:text-base'>{description}</p>
				)}
			</div>
		</div>
	)
}
