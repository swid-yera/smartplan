import * as React from 'react'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@shadcn'
import { type LucideIcon } from 'lucide-react'

import { ThemeToggle } from './theme-toggle'

export function NavFooter({
	items,
	...props
}: {
	items: {
		title: string
		url: string
		icon: LucideIcon
	}[]
} & React.ComponentPropsWithoutRef<typeof SidebarMenu>) {
	return (
		<SidebarMenu {...props}>
			<ThemeToggle />

			{items.map((item) => (
				<SidebarMenuItem key={item.title}>
					<SidebarMenuButton asChild size='sm'>
						<a className='text-muted-foreground' href={item.url}>
							<item.icon />
							<span>{item.title}</span>
						</a>
					</SidebarMenuButton>
				</SidebarMenuItem>
			))}
		</SidebarMenu>
	)
}
