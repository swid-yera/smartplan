'use client'

import * as React from 'react'

import { Button, Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@ui'

import { services } from '@/services'
import { useAuthStore } from '@/store'

import { navFooter, navMain } from './nav-data'
import { NavFooter } from './nav-footer'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

export function ASidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user, isAuthenticated } = useAuthStore()

	return (
		<Sidebar className='border-r-0' collapsible='offcanvas' variant='inset' {...props}>
			<SidebarHeader>
				{isAuthenticated && user ? (
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
