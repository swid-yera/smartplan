'use client'

import * as React from 'react'

import { Button, Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@ui'

import { services } from '@/services'

import { navFooter, navMain, navUser } from './nav-data'
import { NavFooter } from './nav-footer'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

export function ASidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const session = ''

	console.log('session from a-sidebar.tsx', session)

	return (
		<Sidebar className='border-r-0' collapsible='offcanvas' variant='inset' {...props}>
			<SidebarHeader>
				{session ? (
					<NavUser user={navUser} />
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
