import type { BackendLocale, Locale, LocaleText, LocalizedText } from '@types'

export const SITE_LOCALE_COOKIE_KEY = 'site_locale'
export const DEFAULT_SITE_LOCALE: Locale = 'ru'

export const isSiteLocale = (value: unknown): value is Locale => value === 'ru' || value === 'kk'

export const isLocaleText = (value: unknown): value is LocaleText => {
	if (!value || typeof value !== 'object') return false

	return 'ru' in value && 'kz' in value
}

export const toBackendLocale = (locale: Locale): BackendLocale => (locale === 'kk' ? 'kz' : 'ru')

export const getLocaleText = (value: LocalizedText, locale: Locale = DEFAULT_SITE_LOCALE): string => {
	if (!value) return ''
	if (typeof value === 'string') return value
	if (!isLocaleText(value)) return ''

	const preferredValue = locale === 'kk' ? value.kz : value.ru

	return preferredValue?.trim() || value.ru?.trim() || value.kz?.trim() || ''
}

export const createLocaleText = (ruValue: string, kkValue?: string): LocaleText => {
	const trimmedRuValue = ruValue.trim()
	const trimmedKkValue = kkValue?.trim() || trimmedRuValue

	return {
		ru: trimmedRuValue,
		kz: trimmedKkValue,
	}
}

export const getSiteLocaleFromStorage = (): Locale => {
	if (typeof window === 'undefined') return DEFAULT_SITE_LOCALE

	const cookieLocale = document.cookie
		.split(';')
		.map((chunk) => chunk.trim())
		.find((chunk) => chunk.startsWith(`${SITE_LOCALE_COOKIE_KEY}=`))
		?.split('=')[1]

	if (isSiteLocale(cookieLocale)) return cookieLocale

	const localStorageLocale = window.localStorage.getItem(SITE_LOCALE_COOKIE_KEY)

	if (isSiteLocale(localStorageLocale)) return localStorageLocale

	const browserLocale = window.navigator.language?.toLowerCase() || ''

	if (browserLocale.startsWith('kk')) return 'kk'

	return DEFAULT_SITE_LOCALE
}

export const writeSiteLocale = (locale: Locale) => {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(SITE_LOCALE_COOKIE_KEY, locale)
	document.cookie = `${SITE_LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`
	document.documentElement.lang = locale
}
