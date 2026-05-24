'use client'

import { useMemo } from 'react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, SidebarMenuButton } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQueryClient } from '@tanstack/react-query'
import type { Locale } from '@types'
import { Languages } from 'lucide-react'

import sidebarLocale from './locale.json'

export function LanguageToggle() {
	const queryClient = useQueryClient()
	const locale = useLocaleStore((state) => state.locale)
	const setLocale = useLocaleStore((state) => state.setLocale)
	const t = sidebarLocale[locale] ?? sidebarLocale.ru

	const localeName = useMemo(() => (locale === 'kk' ? t.language.kkName : t.language.ruName), [locale, t.language.kkName, t.language.ruName])

	const changeLocale = (nextLocale: Locale) => {
		if (nextLocale === locale) return

		setLocale(nextLocale)
		queryClient.invalidateQueries()
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton>
					<Languages />
					<span className='text-xs'>{localeName}</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => changeLocale('ru')}>
					RU
					<span className='text-muted-foreground'>{t.language.ruName}</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => changeLocale('kk')}>
					KK
					<span className='text-muted-foreground'>{t.language.kkName}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
