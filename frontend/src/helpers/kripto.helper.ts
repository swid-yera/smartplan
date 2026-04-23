const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ParsedKriptoPayload = Record<string, unknown>

export const parseKriptoFileText = (rawText: string): ParsedKriptoPayload => {
	const text = rawText.replace(/^\uFEFF/, '').trim()
	if (!text) {
		throw new Error('Файл пустой')
	}

	if (text.startsWith('{') || text.startsWith('[')) {
		const parsed = JSON.parse(text)

		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error('Неверный JSON формат файла')
		}

		return parsed as ParsedKriptoPayload
	}

	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)

	// if txt contains only UUID - treat it as key_id
	if (lines.length === 1 && UUID_REGEX.test(lines[0])) {
		return { key_id: lines[0] }
	}

	const payload: ParsedKriptoPayload = {}

	for (const line of lines) {
		const separator = line.includes('=') ? '=' : line.includes(':') ? ':' : ''
		if (!separator) continue

		const [k, ...rest] = line.split(separator)
		const key = k.trim()
		const value = rest.join(separator).trim()
		if (!key || !value) continue

		payload[key] = value
	}

	if (!Object.keys(payload).length) {
		throw new Error('Не удалось распарсить .kripto файл')
	}

	return payload
}

export const extractKeyIdFromKriptoPayload = (payload: ParsedKriptoPayload): string => {
	const candidates = [
		payload.key_id,
		payload.keyId,
		payload['key-id'],
		payload.id,
		payload['key'],
	]

	for (const value of candidates) {
		if (typeof value !== 'string') continue
		const trimmed = value.trim()
		if (UUID_REGEX.test(trimmed)) return trimmed
	}

	throw new Error('В файле не найден валидный key_id (UUID)')
}
