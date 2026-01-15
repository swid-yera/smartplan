'use client'

import * as React from 'react'

import { Sidebar, SidebarContent, SidebarFooter } from '@ui'

import { navFooter, navMain } from './nav-data'
import { NavFooter } from './nav-footer'
import { AppSidebarHeader } from './nav-header'
import { NavMain } from './nav-main'

export function ASidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar className='border-r-0' collapsible='icon' variant='inset' {...props}>
			<AppSidebarHeader />
			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavFooter className='mt-auto' items={navFooter} />
			</SidebarFooter>
		</Sidebar>
	)
}
