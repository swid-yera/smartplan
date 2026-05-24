'use client'

import { type FC, useEffect, useState } from 'react'

import Link from 'next/link'

import { getCollapseState, hasRole, setCollapseState } from '@helpers'
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
import { useAuthStore } from '@store'
import { useLocaleStore } from '@store'
import { RoleEnum } from '@types'
import { ChevronRight } from 'lucide-react'

import type { INav } from './nav-data'
import sidebarLocale from './locale.json'

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
					<MenuItem key={item.id} item={item} setOpen={setOpen} userRole={user.role} />
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}

interface IMenuItem {
	item: INav
	setOpen: (open: boolean) => void
	userRole: RoleEnum
}

const MenuItem: FC<IMenuItem> = ({ item, setOpen, userRole }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = sidebarLocale[locale] ?? sidebarLocale.ru

	if (item.role && !hasRole(userRole, item.role, true)) return null

	if (item.items) {
		const filteredSubItems = item.items.filter((sub) => !sub.role || hasRole(userRole, sub.role, true))

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
						<SidebarMenuButton className='group' tooltip={t.nav[item.titleKey as keyof typeof t.nav] || item.titleKey}>
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
