import { expect, test } from 'bun:test'

import { createAward, createTestState, destroyTestState, getAwards } from './src/test-kit'

const MANAGE_ORDER = ['IN_REVIEW', 'REJECTED', 'APPROVED', 'DRAFT']
const VIEW_ORDER = ['REJECTED', 'DRAFT', 'IN_REVIEW', 'APPROVED']
const runTest = process.env.KEYCLOAK_TEST_PASSWORD?.trim() ? test : test.skip

async function seedAwardsWithStatuses(kind: 'view' | 'manage', statuses: string[]) {
	const state = await createTestState(kind)
	const awardIds: string[] = []

	try {
		for (const index of statuses.keys()) {
			const response = await createAward(state.actor.cookie, state.fixture, `${kind}-${index}`)
			expect(response.status).toBe(200)
			expect(response.data?.id).toBeTruthy()
			awardIds.push(response.data!.id)
		}

		await state.sql.begin(async (tx) => {
			for (let index = 0; index < statuses.length; index += 1) {
				await tx`
					UPDATE awards
					SET status = ${statuses[index]}::awards_status,
					    updated_at = NOW()
					WHERE id = ${awardIds[index]}
				`
			}
		})

		const awardsResponse = await getAwards(state.actor.cookie)
		expect(awardsResponse.status).toBe(200)
		expect(Array.isArray(awardsResponse.data?.data)).toBe(true)

		const receivedStatuses = awardsResponse.data?.data
			.filter((item) => awardIds.includes(item.id))
			.map((item) => item.status)

		expect(receivedStatuses).toEqual(statuses)
	} finally {
		await destroyTestState(state)
	}
}

runTest('KPI-manage awards list sorts by review, rejected, approved, draft', async () => {
	await seedAwardsWithStatuses('manage', MANAGE_ORDER)
})

runTest('KPI-view awards list sorts by rejected, draft, review, approved', async () => {
	await seedAwardsWithStatuses('view', VIEW_ORDER)
})
