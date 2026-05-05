const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const HEX_32_BYTES_REGEX = /^[0-9a-f]{64}$/i

type UnknownRecord = Record<string, unknown>

export interface KriptoApprovalProof {
	keyId: string
	userId: string
	publicKey: string
	challenge: string
	signature: string
}

export interface KriptoApprovalMetadata {
	keyId: string
	userId: string
	publicKey: string
}

interface KriptoV3Payload {
	keyId: string
	userId: string
	publicKey: string
	encryptedPrivateKey: string
	salt: string
	nonce: string
	iterations: number
}

const ED25519_PKCS8_PREFIX = new Uint8Array([
	0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
])
const ED25519_SPKI_PREFIX = new Uint8Array([
	0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
])

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
	}
}

export const createKriptoApprovalProof = async (
	rawText: string,
	password: string,
	challenge: string,
): Promise<KriptoApprovalProof> => {
	if (!password) throw new Error('Введите пароль от .kripto')
	if (!challenge) throw new Error('Backend challenge пустой')

	const payload = toKriptoV3Payload(parseKriptoFileText(rawText))
	const privateKeyBytes = await decryptPrivateKey(payload, password)
	const privateKey = await importEd25519PrivateKey(privateKeyBytes)
	const publicKeyBytes = decodeHexPublicKey(payload.publicKey)
	const publicKey = await importEd25519PublicKey(publicKeyBytes)

	const probe = new TextEncoder().encode('eduplan-kripto-v3-public-private-check')
	const probeSignature = await crypto.subtle.sign('Ed25519', privateKey, probe)
	const matched = await crypto.subtle.verify('Ed25519', publicKey, probeSignature, probe)
	if (!matched) throw new Error('Приватный ключ не соответствует публичному ключу')

	const challengeHash = await getChallengePayloadHash(challenge)
	const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', privateKey, challengeHash))

	return {
		keyId: payload.keyId,
		userId: payload.userId,
		publicKey: encodeHex(publicKeyBytes),
		challenge,
		signature: encodeHex(signature),
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
	if (!nonce || !isValidBase64(nonce)) throw new Error('.kripto v3 encryptedPrivateKey.nonce должен быть валидным base64')
	if (!iterationsRaw || iterationsRaw < 1000) {
		throw new Error('.kripto v3 содержит некорректный PBKDF2 iterations')
	}

	return { keyId, userId, publicKey, encryptedPrivateKey, salt, nonce, iterations: iterationsRaw }
}

const decryptPrivateKey = async (payload: KriptoV3Payload, password: string): Promise<Uint8Array> => {
	const passwordKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
		'deriveKey',
	])
	const aesKey = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: decodeBase64(payload.salt),
			iterations: payload.iterations,
		},
		passwordKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['decrypt'],
	)

	const ciphertext = decodeBase64(payload.encryptedPrivateKey)

	try {
		return new Uint8Array(
			await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase64(payload.nonce), tagLength: 128 }, aesKey, ciphertext),
		)
	} catch {
		throw new Error('Не удалось расшифровать приватный ключ: неверный пароль или поврежденный файл')
	}
}

const importEd25519PrivateKey = async (keyBytes: Uint8Array): Promise<CryptoKey> => {
	const pkcs8 = keyBytes.length === 32 ? concatBytes(ED25519_PKCS8_PREFIX, keyBytes) : keyBytes

	try {
		return await crypto.subtle.importKey('pkcs8', pkcs8, 'Ed25519', false, ['sign'])
	} catch {
		throw new Error('Расшифрованный приватный ключ не является ED25519 ключом')
	}
}

const importEd25519PublicKey = async (keyBytes: Uint8Array): Promise<CryptoKey> => {
	try {
		return await crypto.subtle.importKey('spki', concatBytes(ED25519_SPKI_PREFIX, keyBytes), 'Ed25519', false, ['verify'])
	} catch {
		throw new Error('publicKey не является ED25519 ключом')
	}
}

const decodeHexPublicKey = (value: string): Uint8Array => {
	if (!HEX_32_BYTES_REGEX.test(value)) throw new Error('publicKey должен быть hex 64 символа')
	const out = new Uint8Array(32)
	for (let i = 0; i < out.length; i += 1) {
		out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16)
	}
	return out
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

const decodeBase64 = (value: string): Uint8Array => {
	const normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/')
	const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
	const binary = atob(padded)
	const out = new Uint8Array(binary.length)

	for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
	return out
}

const getChallengePayloadHash = async (challenge: string): Promise<Uint8Array> => {
	const [payloadPart, macPart] = challenge.split('.')
	if (!payloadPart || !macPart) throw new Error('Backend challenge имеет неверный формат')

	return new Uint8Array(await crypto.subtle.digest('SHA-256', decodeBase64(payloadPart)))
}

const isValidBase64 = (value: string): boolean => {
	try {
		decodeBase64(value)
		return true
	} catch {
		return false
	}
}

const encodeHex = (bytes: Uint8Array): string => {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const concatBytes = (...chunks: Uint8Array[]): Uint8Array => {
	const length = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
	const out = new Uint8Array(length)
	let offset = 0

	for (const chunk of chunks) {
		out.set(chunk, offset)
		offset += chunk.length
	}

	return out
}
