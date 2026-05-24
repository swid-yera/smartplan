'use client'

import { useMemo } from 'react'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, SidebarMenuButton } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQueryClient } from '@tanstack/react-query'
import type { Locale } from '@types'
import { Languages } from 'lucide-react'

const LANGUAGE_TITLES: Record<Locale, { label: string; name: string }> = {
	ru: {
		label: 'RU',
		name: 'Русский',
	},
	kk: {
		label: 'KK',
		name: 'Қазақша',
	},
}

export function LanguageToggle() {
	const queryClient = useQueryClient()
	const locale = useLocaleStore((state) => state.locale)
	const setLocale = useLocaleStore((state) => state.setLocale)

	const localeName = useMemo(() => LANGUAGE_TITLES[locale].name, [locale])

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
					<span className='text-muted-foreground'>Русский</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => changeLocale('kk')}>
					KK
					<span className='text-muted-foreground'>Қазақша</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
