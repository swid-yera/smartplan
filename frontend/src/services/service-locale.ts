import { DEFAULT_SITE_LOCALE, getSiteLocaleFromStorage, toBackendLocale } from '@helpers'
import type { BackendLocale, Locale } from '@types'

export const getCurrentSiteLocale = (): Locale => {
	if (typeof window === 'undefined') return DEFAULT_SITE_LOCALE

	return getSiteLocaleFromStorage()
}

export const getCurrentBackendLocale = (): BackendLocale => {
	const locale = getCurrentSiteLocale()

	return toBackendLocale(locale)
}
