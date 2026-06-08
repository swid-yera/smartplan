import { cookies, headers } from 'next/headers'

import { SITE_LOCALE_COOKIE_KEY, isSiteLocale } from '@helpers'
import type { IUser, Locale } from '@types'

import { apiBaseUrl } from './public-env'

const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`)

const getRequestOrigin = async () => {
	const headerStore = await headers()
	const proto = headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http'
	const host =
		headerStore.get('x-forwarded-host')?.split(',')[0]?.trim() || headerStore.get('host') || 'localhost:3000'

	return `${proto}://${host}`
}

export const getServerLocale = async (): Promise<Locale> => {
	const cookieStore = await cookies()
	const locale = cookieStore.get(SITE_LOCALE_COOKIE_KEY)?.value

	return isSiteLocale(locale) ? locale : 'ru'
}

export const getServerApiUrl = async (path = ''): Promise<string> => {
	const baseUrl = trimTrailingSlash(apiBaseUrl)

	if (ABSOLUTE_URL_RE.test(baseUrl)) {
		return `${baseUrl}${ensureLeadingSlash(path)}`
	}

	const origin = await getRequestOrigin()

	if (baseUrl.startsWith('/')) {
		return `${origin}${baseUrl}${ensureLeadingSlash(path)}`
	}

	return `${origin}/${baseUrl}${ensureLeadingSlash(path)}`
}

interface IServerFetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
	headers?: HeadersInit
	includeSid?: boolean
	revalidate?: number
	tags?: string[]
}

export const serverFetchJson = async <T>(path: string, options: IServerFetchOptions = {}): Promise<T> => {
	const { includeSid = false, revalidate, tags, headers: requestHeaders, ...init } = options
	const requestUrl = await getServerApiUrl(path)
	const cookieStore = includeSid ? await cookies() : null
	const requestHeadersValue = new Headers(requestHeaders)

	if (includeSid) {
		const sid = cookieStore?.get('sid')?.value

		if (sid) {
			requestHeadersValue.set('cookie', `sid=${sid}`)
		}
	}

	const response = await fetch(requestUrl, {
		...init,
		headers: requestHeadersValue,
		cache: init.cache ?? (revalidate || tags ? 'force-cache' : 'no-store'),
		next: revalidate || tags ? { revalidate, tags } : undefined,
	})

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status} for ${path}`)
	}

	if (response.status === 204) {
		return undefined as T
	}

	return (await response.json()) as T
}

export const getServerAuthUser = async (): Promise<IUser | null> => {
	const cookieStore = await cookies()
	const sid = cookieStore.get('sid')?.value

	if (!sid) return null

	try {
		const requestUrl = await getServerApiUrl('/me')
		const response = await fetch(requestUrl, {
			headers: {
				cookie: `sid=${sid}`,
			},
			cache: 'no-store',
		})

		if (!response.ok) return null

		const user = (await response.json()) as IUser | null

		if (!user?.keycloakId || !user?.username) return null

		return user
	} catch {
		return null
	}
}
