import type { Locale } from '@types'

import commonLocale from '../locales/common.locale.json'

export type UILocaleDictionary<T> = Record<Locale, T>

export const getUILocaleSection = <T>(dictionary: UILocaleDictionary<T>, locale: Locale): T => {
	return dictionary[locale] ?? dictionary.ru
}

export const interpolateUILocaleText = (template: string, variables: Record<string, string | number>) => {
	return Object.entries(variables).reduce((acc, [key, value]) => {
		return acc.replaceAll(`{${key}}`, String(value))
	}, template)
}

export const getCommonLocale = (locale: Locale) => {
	return getUILocaleSection(commonLocale, locale)
}
