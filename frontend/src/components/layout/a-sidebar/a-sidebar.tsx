'use client'

import * as React from 'react'

import { Sidebar, SidebarContent, SidebarFooter } from '@shadcn'

import { navFooter, navMain } from './nav-data'
import { NavFooter } from './nav-footer'
import { ASidebarHeader } from './nav-header'
import { NavMain } from './nav-main'

export function ASidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar className='border-r-0' collapsible='icon' variant='floating' {...props}>
			<ASidebarHeader />

			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>

			<SidebarFooter>
				<NavFooter items={navFooter} />
			</SidebarFooter>
		</Sidebar>
	)
}
