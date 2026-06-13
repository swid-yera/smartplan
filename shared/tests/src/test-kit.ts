import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postgres from 'postgres'
import { createClient } from 'redis'

declare const process: {
	env: {
		API_BASE_URL?: string
		DATABASE_URL?: string
		POSTGRES_URL?: string
		REDIS_URL?: string
		TEST_PREFIX?: string
		KEYCLOAK_TEST_USERNAME?: string
		KEYCLOAK_TEST_PASSWORD?: string
		[key: string]: string | undefined
	}
}

loadTestEnvFile()

export type ActorKind = 'view' | 'manage'

type AuthActor = {
	userId: string
	sessionId: string
	cookie: string
}

type FixtureSeed = {
	awardTypeId: string
	awardVariantId: string
	awardCriteriaId: string
	categoryId: string
	fieldKey: string
	cleanup: () => Promise<void>
}

export type TestState = {
	sql: ReturnType<typeof postgres>
	redis: ReturnType<typeof createClient>
	actor: AuthActor
	fixture: FixtureSeed
}

export type ApiResponse<T = unknown> = {
	status: number
	ok: boolean
	data: T | null
	text: string
}

type MeResponse = {
	keycloakId: string
	email?: string
	username?: string
	permissions?: string[]
	role?: string
	userType?: string
}

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
const DATABASE_URL =
	process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://admin:admin@localhost:5432/eduplan'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const TEST_PREFIX = process.env.TEST_PREFIX || 'shared-bun-kpi'
const KEYCLOAK_TEST_USERNAME = process.env.KEYCLOAK_TEST_USERNAME || 'teachertest'
const KEYCLOAK_TEST_PASSWORD = process.env.KEYCLOAK_TEST_PASSWORD?.trim() || ''

export async function createTestState(kind: ActorKind): Promise<TestState> {
	const sql = postgres(DATABASE_URL, { max: 1, prepare: false })
	const redis = createClient({ url: REDIS_URL })
	await redis.connect()

	let actor: AuthActor | null = null
	let fixture: FixtureSeed | null = null

	try {
		actor = await loginKeycloakTeacher(kind)
		await seedActorPermissions(sql, actor.userId, kind)
		fixture = await seedAwardFixture(sql, kind)
		return { sql, redis, actor, fixture }
	} catch (error) {
		if (fixture) {
			await fixture.cleanup()
		}
		if (actor) {
			await cleanupActor(sql, redis, actor)
		}
		await redis.quit()
		await sql.end({ timeout: 5 })
		throw error
	}
}

export async function destroyTestState(state: TestState) {
	await state.fixture.cleanup()
	await cleanupActor(state.sql, state.redis, state.actor)
	await state.redis.quit()
	await state.sql.end({ timeout: 5 })
}

export async function loginKeycloakTeacher(kind: ActorKind): Promise<AuthActor> {
	if (!KEYCLOAK_TEST_PASSWORD) {
		throw new Error('KEYCLOAK_TEST_PASSWORD is required to authenticate teachertest through /login')
	}

	const jar = new CookieJar()
	const loginPage = await followRedirects(`${API_BASE_URL}/login`, { method: 'GET' }, jar)
	const loginHtml = await loginPage.text()

	if (!looksLikeKeycloakLoginPage(loginHtml)) {
		throw new Error('Keycloak login page was not returned after /login')
	}

	const { action, fields } = parseLoginForm(loginHtml, loginPage.url)
	fields.set('username', KEYCLOAK_TEST_USERNAME)
	fields.set('password', KEYCLOAK_TEST_PASSWORD)

	const authResponse = await followRedirects(
		action,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: fields,
		},
		jar,
	)

	const sid = jar.get('sid')!
	if (!sid) {
		const responseText = await authResponse.text().catch(() => '')
		const preview = responseText.replace(/\s+/g, ' ').slice(0, 200)
		throw new Error(
			`teachertest login failed for ${kind} flow: sid cookie was not created (status=${authResponse.status}, preview=${preview})`,
		)
	}

	const me = await apiRequest<MeResponse>('/me', {
		method: 'GET',
		cookie: `sid=${sid}`,
	})

	if (!me.ok || !me.data?.keycloakId) {
		throw new Error(`teachertest login succeeded but /me failed for ${kind} flow`)
	}

	return {
		userId: me.data.keycloakId,
		sessionId: sid,
		cookie: `sid=${sid}`,
	}
}

export async function seedActorPermissions(
	sql: ReturnType<typeof postgres>,
	userId: string,
	kind: ActorKind,
) {
	const permissions = kind === 'view' ? ['KPI-view'] : ['KPI-manage']

	await sql`
		INSERT INTO permissions (user_id, permissions)
		VALUES (
			${userId},
			${permissions}::permission_code[]
		)
		ON CONFLICT (user_id) DO UPDATE SET
			permissions = EXCLUDED.permissions,
			updated_at = NOW()
	`
}

export async function cleanupActor(
	sql: ReturnType<typeof postgres>,
	redis: ReturnType<typeof createClient>,
	actor: AuthActor,
) {
	await redis.del([`session:${actor.sessionId}`, `user_sessions:${actor.userId}`])

	await sql.begin(async (tx) => {
		await tx`DELETE FROM awards WHERE teacher = ${actor.userId}`
		await tx`DELETE FROM permissions WHERE user_id = ${actor.userId}`
	})
}

export async function seedAwardFixture(
	sql: ReturnType<typeof postgres>,
	kind: ActorKind,
): Promise<FixtureSeed> {
	const awardCriteriaId = randomUUID()
	const awardVariantId = randomUUID()
	const awardTypeId = randomUUID()
	const categoryId = randomUUID()
	const fieldKey = 'comment'
	const prefix = `${TEST_PREFIX}.${kind}.${categoryId.slice(0, 8)}`

	await sql.begin(async (tx) => {
		await tx`
			INSERT INTO award_type_criteria (id, name, points, method)
			VALUES (
				${awardCriteriaId},
				${tx.json({ ru: `${prefix} criteria`, kz: `${prefix} criteria` })},
				${'{10}'}::int[],
				${'NORMAL'}::enum_criteria_method
			)
		`

		await tx`
			INSERT INTO award_type_variants (id, name, description, criteria, bonus_criteria)
			VALUES (
				${awardVariantId},
				${tx.json({ ru: `${prefix} variant`, kz: `${prefix} variant` })},
				${tx.json({ ru: `${prefix} variant description`, kz: `${prefix} variant description` })},
				${pgUuidArray([awardCriteriaId])}::uuid[],
				${null}
			)
		`

		await tx`
			INSERT INTO award_types (id, name, variants)
			VALUES (
				${awardTypeId},
				${tx.json({ ru: `${prefix} type`, kz: `${prefix} type` })},
				${pgUuidArray([awardVariantId])}::uuid[]
			)
		`

		await tx`
			INSERT INTO award_categories (id, award_types, name, icon, description)
			VALUES (
				${categoryId},
				${pgUuidArray([awardTypeId])}::uuid[],
				${tx.json({ ru: `${prefix} category`, kz: `${prefix} category` })},
				${null},
				${tx.json({ ru: `${prefix} category description`, kz: `${prefix} category description` })}
			)
		`

		await tx`
			INSERT INTO award_category_fields (
				category_id,
				key,
				label,
				type,
				required,
				placeholder,
				help_text,
				options,
				validation,
				sort_order
			)
			VALUES (
				${categoryId},
				${fieldKey},
				${tx.json({ ru: 'Comment', kz: 'Comment' })},
				${'text'},
				${false},
				${null},
				${null},
				${tx.json([])},
				${tx.json({})},
				${0}
			)
		`
	})

	return {
		awardTypeId,
		awardVariantId,
		awardCriteriaId,
		categoryId,
		fieldKey,
		cleanup: async () => {
			await sql.begin(async (tx) => {
				await tx`DELETE FROM awards WHERE category_id = ${categoryId}`
				await tx`DELETE FROM award_category_fields WHERE category_id = ${categoryId}`
				await tx`DELETE FROM award_categories WHERE id = ${categoryId}`
				await tx`DELETE FROM award_types WHERE id = ${awardTypeId}`
				await tx`DELETE FROM award_type_variants WHERE id = ${awardVariantId}`
				await tx`DELETE FROM award_type_criteria WHERE id = ${awardCriteriaId}`
			})
		},
	}
}

export async function apiRequest<T = unknown>(
	path: string,
	options: {
		method?: string
		body?: BodyInit | null
		cookie?: string
	} = {},
): Promise<ApiResponse<T>> {
	const headers = new Headers()
	if (options.cookie) headers.set('Cookie', options.cookie)
	if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
		headers.set('Content-Type', 'application/json')
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: options.method ?? 'GET',
		headers,
		body: options.body ?? null,
	})

	const text = await response.text()
	const data = text.trim() ? (tryParseJson<T>(text) as T) : null

	return {
		status: response.status,
		ok: response.ok,
		data,
		text,
	}
}

export async function createAward(cookie: string, fixture: FixtureSeed, comment: string) {
	const form = new FormData()
	form.set(
		'data',
		JSON.stringify({
			type: fixture.awardTypeId,
			variant: fixture.awardVariantId,
			criteria: fixture.awardCriteriaId,
			categoryId: fixture.categoryId,
			fieldValues: {
				[fixture.fieldKey]: comment,
			},
		}),
	)

	return apiRequest<{ id: string; status: string }>('/awards', {
		method: 'POST',
		cookie,
		body: form,
	})
}

export async function updateAward(cookie: string, fixture: FixtureSeed, awardId: string, comment: string) {
	return apiRequest<{ id: string; status: string }>(`/awards/${awardId}`, {
		method: 'PUT',
		cookie,
		body: JSON.stringify({
			type: fixture.awardTypeId,
			variant: fixture.awardVariantId,
			criteria: fixture.awardCriteriaId,
			categoryId: fixture.categoryId,
			fieldValues: {
				[fixture.fieldKey]: comment,
			},
			totalPoints: 0,
		}),
	})
}

export async function updateAwardStatus(cookie: string, awardId: string, payload: Record<string, unknown>) {
	return apiRequest<{ id: string; status: string }>(`/awards/${awardId}/status`, {
		method: 'PUT',
		cookie,
		body: JSON.stringify(payload),
	})
}

export async function deleteAward(cookie: string, awardId: string) {
	return apiRequest(`/awards/${awardId}`, {
		method: 'DELETE',
		cookie,
	})
}

export async function getAwards(cookie: string) {
	return apiRequest<{ data: Array<{ id: string; status: string }> }>('/awards', {
		method: 'GET',
		cookie,
	})
}

export async function getAwardById(cookie: string, awardId: string) {
	return apiRequest<{ id: string; status: string }>(`/awards/${awardId}`, {
		method: 'GET',
		cookie,
	})
}

function pgUuidArray(values: string[]) {
	return `{${values.join(',')}}`
}

function tryParseJson<T>(text: string): T | null {
	try {
		return JSON.parse(text) as T
	} catch {
		return null
	}
}

class CookieJar {
	private readonly cookies = new Map<string, string>()

	ingest(headers: Headers) {
		for (const rawCookie of readSetCookies(headers)) {
			const parsed = parseSetCookie(rawCookie)
			if (!parsed) continue
			this.cookies.set(parsed.name, parsed.value)
		}
	}

	get(name: string) {
		return this.cookies.get(name)
	}

	toHeader() {
		return [...this.cookies.entries()]
			.map(([name, value]) => `${name}=${value}`)
			.join('; ')
	}
}

async function followRedirects(
	url: string,
	init: RequestInit,
	jar: CookieJar,
	maxRedirects = 10,
) {
	let currentUrl = url
	let currentInit = { ...init }

	for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
		const headers = new Headers(currentInit.headers)
		const cookieHeader = jar.toHeader()
		if (cookieHeader) {
			headers.set('Cookie', cookieHeader)
		}

		const response = await fetch(currentUrl, {
			...currentInit,
			headers,
			redirect: 'manual',
		})

		jar.ingest(response.headers)

		if (!isRedirectStatus(response.status)) {
			return response
		}

		const location = response.headers.get('location')
		if (!location) {
			return response
		}

		currentUrl = new URL(location, currentUrl).toString()
		currentInit = redirectToNextRequest(currentInit, response.status)
	}

	throw new Error(`Redirect chain exceeded ${maxRedirects} hops for ${url}`)
}

function redirectToNextRequest(init: RequestInit, status: number): RequestInit {
	if (status === 307 || status === 308) {
		return {
			...init,
			headers: init.headers,
		}
	}

	return {
		method: 'GET',
		headers: undefined,
		body: undefined,
	}
}

function isRedirectStatus(status: number) {
	return status >= 300 && status < 400
}

function looksLikeKeycloakLoginPage(html: string) {
	return /name=["']username["']|id=["']username["']/i.test(html) && /name=["']password["']|id=["']password["']/i.test(html)
}

function parseLoginForm(html: string, pageUrl: string) {
	const formMatch =
		html.match(/<form\b[^>]*id=["']kc-form-login["'][\s\S]*?<\/form>/i) ??
		html.match(/<form\b[\s\S]*?<\/form>/i)

	if (!formMatch) {
		throw new Error('Keycloak login form was not found')
	}

	const formHtml = formMatch[0]
	const actionMatch = formHtml.match(/action=["']([^"']+)["']/i)
	if (!actionMatch) {
		throw new Error('Keycloak login form action was not found')
	}

	const fields = new URLSearchParams()
	for (const inputMatch of formHtml.matchAll(/<input\b([^>]*)>/gi)) {
		const attrs = inputMatch[1]
		const name = readAttr(attrs, 'name')
		if (!name) continue
		const value = readAttr(attrs, 'value') ?? ''
		fields.set(name, value)
	}

	return {
		action: new URL(actionMatch[1], pageUrl).toString(),
		fields,
	}
}

function readAttr(attrs: string, attrName: string) {
	const match = attrs.match(new RegExp(`${attrName}=["']([^"']*)["']`, 'i'))
	return match?.[1] ?? ''
}

function readSetCookies(headers: Headers) {
	const anyHeaders = headers as Headers & { getSetCookie?: () => string[] }
	if (typeof anyHeaders.getSetCookie === 'function') {
		return anyHeaders.getSetCookie()
	}

	const raw = headers.get('set-cookie')
	if (!raw) return []

	return raw.split(/,(?=[^;,\s]+=)/g).map((item) => item.trim()).filter(Boolean)
}

function parseSetCookie(rawCookie: string) {
	const firstPart = rawCookie.split(';', 1)[0]?.trim()
	if (!firstPart) return null

	const separatorIndex = firstPart.indexOf('=')
	if (separatorIndex <= 0) return null

	const name = firstPart.slice(0, separatorIndex).trim()
	const value = firstPart.slice(separatorIndex + 1).trim()

	if (!name) return null
	return { name, value }
}

function loadTestEnvFile() {
	const envPath = resolve(process.cwd(), '.env.tests')

	let content: string
	try {
		content = readFileSync(envPath, 'utf8')
	} catch {
		return
	}

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) {
			continue
		}

		const separatorIndex = trimmed.indexOf('=')
		if (separatorIndex <= 0) {
			continue
		}

		const key = trimmed.slice(0, separatorIndex).trim()
		if (!key || process.env[key] !== undefined) {
			continue
		}

		let value = trimmed.slice(separatorIndex + 1).trim()
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}

		process.env[key] = value
	}
}
