export type Locale = 'ru' | 'kk'

export type BackendLocale = 'ru' | 'kz'

export type UILocaleDictionary<T> = Record<Locale, T>

export interface LocaleText {
	ru: string
	kz: string
}

export type LocalizedText = string | LocaleText | null | undefined
