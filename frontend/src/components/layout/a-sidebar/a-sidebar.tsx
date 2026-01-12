'use client'

import * as React from 'react'

import { services } from '@services'
import { useAuthStore } from '@store'
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	Skeleton,
} from '@ui'

import { navFooter, navMain } from './nav-data'
import { NavFooter } from './nav-footer'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

export function ASidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user, isAuthenticated, isLoading } = useAuthStore()

	return (
		<Sidebar className='border-r-0' collapsible='offcanvas' variant='inset' {...props}>
			<SidebarHeader>
				{isLoading ? (
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton className='flex items-center gap-2 p-2' size='lg'>
								{/* avatar skeleton */}
								<Skeleton className='h-8 w-8 rounded-lg' />

								{/* name and roles skeleton */}
								<div className='flex-1 grid gap-1'>
									<Skeleton className='h-4 w-24 rounded' />
									<Skeleton className='h-3 w-16 rounded' />
								</div>

								{/* arrow icon */}
								<Skeleton className='ml-auto h-4 w-4 rounded' />
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				) : isAuthenticated && user ? (
					<NavUser user={user} />
				) : (
					<Button
						className='w-full rounded-full'
						type='button'
						variant='default'
						onClick={services.auth.redirectToLogin}
					>
						Войти
					</Button>
				)}
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavFooter className='mt-auto' items={navFooter} />
			</SidebarFooter>
		</Sidebar>
	)
}
