'use client'

import Image from 'next/image'

import { services } from '@services'
import {
	Button,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { LogInIcon } from 'lucide-react'

import { NavUser } from './nav-user'

interface ASidebarHeaderProps {
	hasSid: boolean
}

export function ASidebarHeader({ hasSid }: ASidebarHeaderProps) {
	const { user, isAuthenticated, authLoading } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const { state, isMobile } = useSidebar()
	const loginLabel = locale === 'kk' ? 'Кіру' : 'Войти'
	const showAuthSkeleton = authLoading && hasSid

	return (
		<SidebarHeader>
			<div className='pb-2 flex items-center justify-between group-data-[collapsible=icon]:justify-center'>
				<div className='flex justify-center items-top font-bold text-primary whitespace-nowrap overflow-hidden transition-all duration-500 max-w-40 opacity-100 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0'>
					<Image alt='' className='inline shrink-0' height={36} src='/eduplan-icon.svg' width={36} />
					<span className='pl-2 text-2xl'>SmartPlan</span>
				</div>

				{/* logotype */}
				<SidebarTrigger className='hover:opacity-100 group-data-[collapsible=icon]:opacity-100 opacity-0' />
			</div>

			{showAuthSkeleton ? (
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton className='flex items-center gap-2 p-2' size='lg'>
							<Skeleton className='h-8 w-8 rounded-lg' />
							<div className='flex-1 grid gap-1'>
								<Skeleton className='h-4 w-24 rounded' />
								<Skeleton className='h-3 w-16 rounded' />
							</div>
							<Skeleton className='ml-auto h-4 w-4 rounded' />
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			) : isAuthenticated && user ? (
				<NavUser user={user} />
			) : (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className='w-full rounded-full transition-all duration-200 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:gap-0'
							type='button'
							variant='default'
							onClick={() => services.auth.redirectToLogin()}
						>
							<LogInIcon />
							<span className='whitespace-nowrap overflow-hidden transition-all duration-200 max-w-24 opacity-100 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0'>
								{loginLabel}
							</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent align='center' hidden={state !== 'collapsed' || isMobile} side='right'>
						{loginLabel}
					</TooltipContent>
				</Tooltip>
			)}
		</SidebarHeader>
	)
}
