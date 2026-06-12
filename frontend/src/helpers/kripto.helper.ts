const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const HEX_32_BYTES_REGEX = /^[0-9a-f]{64}$/i

type UnknownRecord = Record<string, unknown>

export interface KriptoApprovalMetadata {
	keyId: string
	userId: string
	publicKey: string
	encryptedPrivateKey: KriptoEncryptedPrivateKey
	format: string
	version: number
	algorithm: string
}

export interface KriptoEncryptedPrivateKey {
	type?: string
	version?: number
	cipher: string
	kdf: string
	hash: string
	iterations: number
	salt: string
	nonce: string
	value: string
	encoding?: string
}

interface KriptoV3Payload {
	format: string
	version: number
	purpose?: string
	keyId: string
	userId: string
	publicKey: string
	algorithm: string
	deviceName?: string
	createdAt?: string
	encryptedPrivateKey: KriptoEncryptedPrivateKey
	comment?: unknown
}

export const parseKriptoFileText = (rawText: string): UnknownRecord => {
	const text = rawText.replace(/^\uFEFF/, '').trim()

	if (!text) throw new Error('Файл пустой')

	const parsed = JSON.parse(text)

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('Неверный JSON формат .kripto v3')
	}

	return parsed as UnknownRecord
}

export const extractKeyIdFromKriptoPayload = (payload: UnknownRecord): string => {
	const keyId = pickString(payload, ['key_id', 'keyId', 'key-id', 'id'])

	if (!keyId || !UUID_REGEX.test(keyId)) throw new Error('В файле не найден валидный key_id (UUID)')

	return keyId
}

export const extractKriptoApprovalMetadata = (payload: UnknownRecord): KriptoApprovalMetadata => {
	const kriptoPayload = toKriptoV3Payload(payload)

	return {
		keyId: kriptoPayload.keyId,
		userId: kriptoPayload.userId,
		publicKey: kriptoPayload.publicKey.toLowerCase(),
		encryptedPrivateKey: kriptoPayload.encryptedPrivateKey,
		format: kriptoPayload.format,
		version: kriptoPayload.version,
		algorithm: kriptoPayload.algorithm,
	}
}

const toKriptoV3Payload = (payload: UnknownRecord): KriptoV3Payload => {
	if (pickString(payload, ['format']) !== 'KRIPTO_KEY') {
		throw new Error('.kripto v3 должен иметь format KRIPTO_KEY')
	}

	const version = payload.version

	if (version !== 3 && version !== '3') {
		throw new Error('Поддерживается только .kripto v3')
	}
	if (pickString(payload, ['algorithm']).toUpperCase() !== 'ED25519') {
		throw new Error('.kripto v3 должен использовать algorithm ED25519')
	}

	const encrypted = asRecord(payload.encryptedPrivateKey)

	const keyId = extractKeyIdFromKriptoPayload(payload)
	const userId = pickString(payload, ['user_id', 'userId'])
	const publicKey = pickString(payload, ['public_key', 'publicKey'])
	const encryptedPrivateKey = pickString(encrypted, ['value'])
	const salt = pickString(encrypted, ['salt'])
	const nonce = pickString(encrypted, ['nonce'])
	const iterationsRaw = pickNumber(encrypted, ['iterations'])

	if (!userId || !UUID_REGEX.test(userId)) throw new Error('.kripto v3 не содержит валидный userId (UUID)')
	if (!HEX_32_BYTES_REGEX.test(publicKey)) throw new Error('.kripto v3 publicKey должен быть hex 64 символа')
	if (!Object.keys(encrypted).length) throw new Error('.kripto v3 не содержит encryptedPrivateKey')
	if (pickString(encrypted, ['cipher']).toUpperCase() !== 'AES-256-GCM') {
		throw new Error('.kripto v3 encryptedPrivateKey.cipher должен быть AES-256-GCM')
	}
	if (pickString(encrypted, ['kdf']).toUpperCase() !== 'PBKDF2') {
		throw new Error('.kripto v3 encryptedPrivateKey.kdf должен быть PBKDF2')
	}
	if (pickString(encrypted, ['hash']).toUpperCase() !== 'SHA-256') {
		throw new Error('.kripto v3 encryptedPrivateKey.hash должен быть SHA-256')
	}
	if (!encryptedPrivateKey || !isValidBase64(encryptedPrivateKey)) {
		throw new Error('.kripto v3 encryptedPrivateKey.value должен быть валидным base64')
	}
	if (!salt || !isValidBase64(salt)) throw new Error('.kripto v3 encryptedPrivateKey.salt должен быть валидным base64')
	if (!nonce || !isValidBase64(nonce))
		throw new Error('.kripto v3 encryptedPrivateKey.nonce должен быть валидным base64')
	if (!iterationsRaw || iterationsRaw < 1000) {
		throw new Error('.kripto v3 содержит некорректный PBKDF2 iterations')
	}

	return {
		keyId,
		userId,
		publicKey,
		encryptedPrivateKey: {
			type: pickString(encrypted, ['type']) || undefined,
			version: typeof encrypted.version === 'number' ? encrypted.version : undefined,
			cipher: pickString(encrypted, ['cipher']),
			kdf: pickString(encrypted, ['kdf']),
			hash: pickString(encrypted, ['hash']),
			iterations: iterationsRaw,
			salt,
			nonce,
			value: encryptedPrivateKey,
			encoding: pickString(encrypted, ['encoding']) || undefined,
		},
		format: pickString(payload, ['format']),
		version: typeof version === 'number' ? version : 3,
		algorithm: pickString(payload, ['algorithm']),
	}
}

const asRecord = (value: unknown): UnknownRecord => {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {}
}

const pickString = (payload: UnknownRecord, keys: string[]): string => {
	for (const key of keys) {
		const value = payload[key]

		if (typeof value === 'string' && value.trim()) return value.trim()
	}

	return ''
}

const pickNumber = (payload: UnknownRecord, keys: string[]): number => {
	for (const key of keys) {
		const value = payload[key]

		if (typeof value === 'number') return value
		if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
	}

	return 0
}

const decodeBase64 = (value: string): Uint8Array<ArrayBuffer> => {
	const normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/')
	const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
	const binary = atob(padded)
	const out = new Uint8Array(binary.length)

	for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)

	return out
}

const isValidBase64 = (value: string): boolean => {
	try {
		decodeBase64(value)

		return true
	} catch {
		return false
	}
}
