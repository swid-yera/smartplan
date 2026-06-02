const normalizePublicEnv = (value?: string): string | undefined => {
	const normalizedValue = value?.trim()

	if (!normalizedValue) {
		return undefined
	}

	const loweredValue = normalizedValue.toLowerCase()

	if (loweredValue === 'undefined' || loweredValue === 'null') {
		return undefined
	}

	return normalizedValue.replace(/\/+$/, '')
}

const normalizeEnv = (value?: string): string | undefined => {
	const normalizedValue = value?.trim()

	if (!normalizedValue) {
		return undefined
	}

	const loweredValue = normalizedValue.toLowerCase()

	if (loweredValue === 'undefined' || loweredValue === 'null') {
		return undefined
	}

	return normalizedValue
}

export const apiBaseUrl = normalizePublicEnv(process.env.NEXT_PUBLIC_API_URL) ?? '/api/v1'
export const renderApiBaseUrl = normalizePublicEnv(process.env.NEXT_PUBLIC_RENDER_API_URL) ?? '/generate'
export const geminiApiKey = normalizeEnv(process.env.GEMINI_API_KEY)

const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

const isLocalHost = (hostname: string): boolean => localHosts.has(hostname.toLowerCase())

const normalizeBrowserBaseUrl = (baseUrl: string, fallback: string): string => {
	if (typeof window === 'undefined') {
		return baseUrl
	}

	if (baseUrl.startsWith('/')) {
		return baseUrl
	}

	try {
		const configuredUrl = new URL(baseUrl)
		const currentHost = window.location.hostname

		if (isLocalHost(configuredUrl.hostname) && !isLocalHost(currentHost)) {
			return fallback
		}
	} catch {
		return fallback
	}

	return baseUrl
}

export const getApiBaseUrl = (): string => normalizeBrowserBaseUrl(apiBaseUrl, '/api/v1')
export const getRenderApiBaseUrl = (): string => normalizeBrowserBaseUrl(renderApiBaseUrl, '/generate')
