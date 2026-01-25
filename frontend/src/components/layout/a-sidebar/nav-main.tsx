'use client'

import type { FC } from 'react'

import Link from 'next/link'

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@ui'
import { ChevronRight, type LucideIcon } from 'lucide-react'

export function NavMain({
	items,
}: {
	items: {
		title: string
		url: string
		icon: LucideIcon
		items?: {
			title: string
			url: string
		}[]
	}[]
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>EduPlan</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<MenuItem key={item.title} item={item} />
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}

interface IMenuItem {
	item: {
		title: string
		url: string
		icon: LucideIcon
		items?: {
			icon?: LucideIcon
			title: string
			url: string
		}[]
	}
}

const MenuItem: FC<IMenuItem> = ({ item }) => {
	if (item.items) {
		return (
			<SidebarMenuItem>
				<Collapsible defaultOpen>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton tooltip={item.title}>
							<item.icon />
							<span>{item.title}</span>
							<ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
						</SidebarMenuButton>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<SidebarMenuSub>
							{item.items?.map((subItem) => (
								<SidebarMenuSubItem key={subItem.title}>
									<SidebarMenuSubButton asChild>
										<Link href={subItem.url}>
											{subItem.icon && <subItem.icon />}
											<span>{subItem.title}</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							))}
						</SidebarMenuSub>
					</CollapsibleContent>
				</Collapsible>
			</SidebarMenuItem>
		)
	}

	return (
		<SidebarMenuItem key={item.url}>
			<SidebarMenuButton asChild tooltip={item.title}>
				<Link href={item.url}>
					<item.icon />
					<span>{item.title}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	)
}
