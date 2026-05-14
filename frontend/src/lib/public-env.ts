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
