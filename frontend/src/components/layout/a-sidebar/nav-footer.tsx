import * as React from 'react'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@shadcn'
import { useLocaleStore } from '@store'
import { type LucideIcon } from 'lucide-react'

import { LanguageToggle } from './language-toggle'
import sidebarLocale from './locale.json'
import { ThemeToggle } from './theme-toggle'

export function NavFooter({
	items,
	...props
}: {
	items: {
		id: string
		titleKey: string
		url: string
		icon: LucideIcon
	}[]
} & React.ComponentPropsWithoutRef<typeof SidebarMenu>) {
	const locale = useLocaleStore((state) => state.locale)
	const t = sidebarLocale[locale] ?? sidebarLocale.ru

	return (
		<SidebarMenu {...props}>
			<LanguageToggle />
			<ThemeToggle />

			{items.map((item) => (
				<SidebarMenuItem key={item.id}>
					<SidebarMenuButton asChild size='sm'>
						<a className='text-muted-foreground' href={item.url}>
							<item.icon />
							<span>{t.nav[item.titleKey as keyof typeof t.nav] || item.titleKey}</span>
						</a>
					</SidebarMenuButton>
				</SidebarMenuItem>
			))}
		</SidebarMenu>
	)
}
