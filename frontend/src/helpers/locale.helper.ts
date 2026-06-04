import type { BackendLocale, Locale, LocaleText, LocalizedText } from '@types'

export const SITE_LOCALE_COOKIE_KEY = 'site_locale'
export const DEFAULT_SITE_LOCALE: Locale = 'ru'

export const isSiteLocale = (value: unknown): value is Locale => value === 'ru' || value === 'kk'

export const isLocaleText = (value: unknown): value is LocaleText => {
	if (!value || typeof value !== 'object') return false

	return 'ru' in value && 'kz' in value
}

export const toBackendLocale = (locale: Locale): BackendLocale => (locale === 'kk' ? 'kz' : 'ru')

const KZ_SPECIFIC_RE = /[ӘәҒғҚқҢңӨөҰұҮүІі]/
const RU_CAPITAL_RE = /[А-ЯЁ]/
const LETTER_RE = /[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]/
const SHORT_CODE_RE = /^[A-Za-zА-Яа-яЁё0-9._-]{1,8}$/

const normalizeWhitespace = (value: string): string =>
	value
		.replace(/\s+/g, ' ')
		.replace(/\s+([,.;:])/g, '$1')
		.trim()

const stripWrappingQuotes = (value: string): string => {
	let result = value.trim()

	while (
		result.length >= 2 &&
		((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'")))
	) {
		result = result.slice(1, -1).trim()
	}

	return result
}

const extractTextFromStructuredValue = (value: string): string => {
	let current = value.trim()

	for (let attempt = 0; attempt < 3; attempt += 1) {
		const normalized = stripWrappingQuotes(current)
		const looksLikeJson =
			(normalized.startsWith('{') && normalized.endsWith('}')) ||
			(normalized.startsWith('[') && normalized.endsWith(']')) ||
			(normalized.startsWith('"') && normalized.endsWith('"'))

		if (!looksLikeJson) return normalized

		try {
			const parsed = JSON.parse(normalized) as
				| string
				| { translatedText?: unknown; text?: unknown; name?: unknown; value?: unknown }

			if (typeof parsed === 'string') {
				current = parsed
				continue
			}

			const candidate = [parsed.translatedText, parsed.text, parsed.name, parsed.value].find(
				(item) => typeof item === 'string' && item.trim().length > 0,
			)

			if (typeof candidate === 'string') {
				current = candidate
				continue
			}
		} catch {
			return normalized
		}

		return normalized
	}

	return stripWrappingQuotes(current)
}

const looksLikeTextChunk = (value: string): boolean => {
	const letters = stripWrappingQuotes(value).match(LETTER_RE)

	return Boolean(letters) && stripWrappingQuotes(value).replace(/[^A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]/g, '').length >= 3
}

const isShortCodeChunk = (value: string): boolean => {
	const normalized = stripWrappingQuotes(value)

	return normalized.length > 0 && SHORT_CODE_RE.test(normalized)
}

const extractTitleAfterCodeSlash = (value: string): string => {
	const parts = value
		.split('/')
		.map((part) => part.trim())
		.filter(Boolean)

	if (parts.length !== 2) return value

	const [left, right] = parts

	if (isShortCodeChunk(left) && looksLikeTextChunk(right)) {
		return normalizeWhitespace(stripWrappingQuotes(right))
	}

	if (isShortCodeChunk(right) && looksLikeTextChunk(left)) {
		return normalizeWhitespace(stripWrappingQuotes(left))
	}

	return value
}

const extractBySlash = (value: string, locale: Locale): string => {
	const parts = value
		.split('/')
		.map((part) => part.trim())
		.filter(Boolean)

	if (parts.length < 2) return value

	const kzParts = parts.filter((part) => KZ_SPECIFIC_RE.test(part))
	const ruParts = parts.filter((part) => !KZ_SPECIFIC_RE.test(part))

	if (locale === 'kk') return normalizeWhitespace((kzParts[0] ?? parts[0] ?? value).trim())

	return normalizeWhitespace((ruParts.at(-1) ?? parts.at(-1) ?? value).trim())
}

const splitGluedBilingualText = (value: string, locale: Locale): string => {
	if (!KZ_SPECIFIC_RE.test(value)) return value

	const chars = [...value]

	for (let i = 1; i < chars.length; i += 1) {
		const prev = chars[i - 1]
		const curr = chars[i]

		if (!RU_CAPITAL_RE.test(curr)) continue

		// "құрастыру/разработка" -> split before "Разработка"
		if (/[a-zа-яёәғқңөұүі]/i.test(prev) && prev !== ' ' && prev !== '-' && prev !== '—') {
			const left = value.slice(0, i).trim()
			const right = value.slice(i).trim()

			return locale === 'kk' ? normalizeWhitespace(left) : normalizeWhitespace(right)
		}
	}

	return value
}

const normalizeLocalizedText = (value: string, locale: Locale): string => {
	let normalized = normalizeWhitespace(extractTextFromStructuredValue(value))

	if (normalized.includes('/')) {
		normalized = extractTitleAfterCodeSlash(normalized)
	}

	if (normalized.includes('/') && KZ_SPECIFIC_RE.test(normalized)) {
		normalized = extractBySlash(normalized, locale)
	}

	normalized = splitGluedBilingualText(normalized, locale)

	return normalizeWhitespace(stripWrappingQuotes(normalized))
}

export const getLocaleText = (value: LocalizedText, locale: Locale = DEFAULT_SITE_LOCALE): string => {
	if (!value) return ''
	if (typeof value === 'string') return normalizeLocalizedText(value, locale)
	if (!isLocaleText(value)) return ''

	const preferredValue = locale === 'kk' ? value.kz : value.ru

	const resolvedValue = preferredValue?.trim() || value.ru?.trim() || value.kz?.trim() || ''

	return normalizeLocalizedText(resolvedValue, locale)
}

export const getLocaleTextStrict = (value: LocalizedText, locale: Locale = DEFAULT_SITE_LOCALE): string => {
	if (!value) return ''
	if (typeof value === 'string') return normalizeLocalizedText(value, locale)
	if (!isLocaleText(value)) return ''

	const localizedValue = locale === 'kk' ? value.kz : value.ru

	return normalizeLocalizedText(localizedValue?.trim() || '', locale)
}

export const hasLocaleTextForLocale = (value: LocalizedText, locale: Locale = DEFAULT_SITE_LOCALE): boolean =>
	getLocaleTextStrict(value, locale).length > 0

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

export const readSiteLocaleFromCookieValue = (value?: string | null): Locale => {
	return isSiteLocale(value) ? value : DEFAULT_SITE_LOCALE
}

export const writeSiteLocale = (locale: Locale) => {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(SITE_LOCALE_COOKIE_KEY, locale)
	document.cookie = `${SITE_LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`
	document.documentElement.lang = locale
}
