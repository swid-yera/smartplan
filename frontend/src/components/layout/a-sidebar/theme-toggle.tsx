'use client'

import { useEffect, useState } from 'react'

import { useTheme } from 'next-themes'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, SidebarMenuButton } from '@shadcn'
import { useLocaleStore } from '@store'
import { Monitor, Moon, Sun } from 'lucide-react'

import sidebarLocale from './locale.json'

export function ThemeToggle() {
	const locale = useLocaleStore((state) => state.locale)
	const t = sidebarLocale[locale] ?? sidebarLocale.ru
	const [themeText, setThemeText] = useState(sidebarLocale.ru.theme.system)
	const { setTheme, theme } = useTheme()
	const labels = t.theme

	useEffect(() => {
		if (!theme) return

		setThemeText(labels[theme])
	}, [labels, theme])

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton>
					<Sun className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
					<Moon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />

					<span className='text-xs'>{themeText}</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => setTheme('light')}>
					<Sun /> {labels.light}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('dark')}>
					<Moon /> {labels.dark}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('system')}>
					<Monitor /> {labels.system}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
