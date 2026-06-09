'use client'

import { type FC, useEffect, useState } from 'react'

import Link from 'next/link'

import { canAccessNavItem, getCollapseState, setCollapseState } from '@helpers'
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
	useSidebar,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { type IUser } from '@types'
import { ChevronRight } from 'lucide-react'

import sidebarLocale from './locale.json'
import type { INav } from './nav-data'

interface IProps {
	items: INav[]
}

export const NavMain: FC<IProps> = ({ items }) => {
	const { setOpen } = useSidebar()
	const { user, authLoading } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = sidebarLocale[locale] ?? sidebarLocale.ru

	if (authLoading || !user) return

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{t.groupLabel}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<MenuItem key={item.id} item={item} setOpen={setOpen} user={user} />
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}

interface IMenuItem {
	item: INav
	setOpen: (open: boolean) => void
	user: IUser
}

const MenuItem: FC<IMenuItem> = ({ item, setOpen, user }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = sidebarLocale[locale] ?? sidebarLocale.ru

	const canAccessItem = (navItem: INav) => {
		return canAccessNavItem(user, navItem)
	}

	if (!canAccessItem(item)) return null

	if (item.items) {
		const filteredSubItems = item.items.filter((sub) => canAccessItem(sub))

		if (!filteredSubItems.length) return null

		const storageKey = `collapse:${item.id}`

		const [open, setOpenState] = useState(false)

		useEffect(() => {
			const saved = getCollapseState()[storageKey]

			if (typeof saved === 'boolean') setOpenState(saved)
		}, [storageKey])

		const handleOpenChange = (value: boolean) => {
			setOpenState(value)
			setCollapseState(storageKey, value)
		}

		return (
			<SidebarMenuItem onClick={() => setOpen(true)}>
				<Collapsible open={open} onOpenChange={handleOpenChange}>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton
							className='group'
							tooltip={t.nav[item.titleKey as keyof typeof t.nav] || item.titleKey}
						>
							<item.icon />
							<span>{t.nav[item.titleKey as keyof typeof t.nav] || item.titleKey}</span>
							<ChevronRight
								className='ml-auto transition-transform duration-200 group-data-[state=open]:rotate-90'
								data-state={open ? 'open' : 'closed'}
							/>
						</SidebarMenuButton>
					</CollapsibleTrigger>

					<CollapsibleContent>
						<SidebarMenuSub>
							{filteredSubItems.map((subItem) => (
								<SidebarMenuSubItem key={subItem.id}>
									<SidebarMenuSubButton asChild>
										<Link href={subItem.url}>
											{subItem.icon && <subItem.icon />}
											<span>{t.nav[subItem.titleKey as keyof typeof t.nav] || subItem.titleKey}</span>
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
		<SidebarMenuItem>
			<SidebarMenuButton asChild tooltip={t.nav[item.titleKey as keyof typeof t.nav] || item.titleKey}>
				<Link href={item.url}>
					<item.icon />
					<span>{t.nav[item.titleKey as keyof typeof t.nav] || item.titleKey}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	)
}
