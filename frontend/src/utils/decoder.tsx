export function decodeBase64Json<T>(value: string): T {
	if (typeof window === 'undefined') {
		return JSON.parse(Buffer.from(value, 'base64').toString('utf-8'))
	}

	return JSON.parse(atob(value))
}
