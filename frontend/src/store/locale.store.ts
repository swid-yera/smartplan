'use client'

import { DEFAULT_SITE_LOCALE, getSiteLocaleFromStorage, isSiteLocale, writeSiteLocale } from '@helpers'
import type { Locale } from '@types'
import { create } from 'zustand'

interface LocaleState {
	locale: Locale
	initialized: boolean
	setLocale: (locale: Locale) => void
	initializeLocale: () => void
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
	locale: DEFAULT_SITE_LOCALE,
	initialized: false,
	setLocale: (locale) => {
		if (!isSiteLocale(locale)) return

		writeSiteLocale(locale)
		set({ locale })
	},
	initializeLocale: () => {
		if (get().initialized) return

		const locale = getSiteLocaleFromStorage()

		writeSiteLocale(locale)
		set({ locale, initialized: true })
	},
}))
