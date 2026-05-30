import { getLocaleText } from '@helpers'
import type { Locale, LocaleText, LocalizedText } from '@types'

export type RupLocaleKey = keyof LocaleText

export const EMPTY_LOCALE_TEXT: LocaleText = { ru: '', kz: '' }

export const toLocaleKey = (locale: Locale): RupLocaleKey => (locale === 'kk' ? 'kz' : 'ru')

export const toLocaleText = (value: LocalizedText): LocaleText => {
	if (!value) return { ...EMPTY_LOCALE_TEXT }

	if (typeof value === 'string') {
		const trimmed = value.trim()

		return {
			ru: trimmed,
			kz: trimmed,
		}
	}

	const ru = (value.ru ?? '').trim()
	const kz = (value.kz ?? '').trim()

	return {
		ru,
		kz,
	}
}

export const updateLocaleText = (value: LocalizedText, locale: Locale, next: string): LocaleText => {
	const localized = toLocaleText(value)

	return {
		...localized,
		[toLocaleKey(locale)]: next,
	}
}

export const getLocalizedValue = (value: LocalizedText, locale: Locale): string => {
	const localized = toLocaleText(value)

	return localized[toLocaleKey(locale)] ?? ''
}

export const toRussianText = (value: LocalizedText): string => getLocaleText(value, 'ru').trim()
