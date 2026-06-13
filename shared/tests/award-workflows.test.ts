import { expect, test } from 'bun:test'

import {
	createAward,
	createTestState,
	deleteAward,
	destroyTestState,
	getAwardById,
	getAwards,
	updateAward,
	updateAwardStatus,
} from './src/test-kit'

test('KPI-view flow: create, update, submit, delete fails', async () => {
	const state = await createTestState('view')

	try {
		const createResponse = await createAward(state.actor.cookie, state.fixture, 'created by KPI-view')
		expect(createResponse.status).toBe(200)
		expect(createResponse.data?.status).toBe('DRAFT')

		const awardId = createResponse.data?.id
		expect(awardId).toBeTruthy()

		const updateResponse = await updateAward(state.actor.cookie, state.fixture, awardId!, 'updated by KPI-view')
		expect(updateResponse.status).toBe(200)
		expect(updateResponse.data?.status).toBe('DRAFT')

		const submitResponse = await updateAwardStatus(state.actor.cookie, awardId!, {
			status: 'IN_REVIEW',
		})
		expect(submitResponse.status).toBe(200)
		expect(submitResponse.data?.status).toBe('IN_REVIEW')

		const deleteResponse = await deleteAward(state.actor.cookie, awardId!)
		expect(deleteResponse.status).toBe(400)
		expect(deleteResponse.data).toBeTruthy()
		expect((deleteResponse.data as { error?: string } | null)?.error).toContain('Награду можно удалить')
	} finally {
		await destroyTestState(state)
	}
})

test('KPI-manage flow: read, approve, delete fails', async () => {
	const state = await createTestState('manage')

	try {
		const createResponse = await createAward(state.actor.cookie, state.fixture, 'created by KPI-manage')
		expect(createResponse.status).toBe(200)
		expect(createResponse.data?.status).toBe('DRAFT')

		const awardId = createResponse.data?.id
		expect(awardId).toBeTruthy()

		const awardsResponse = await getAwards(state.actor.cookie)
		expect(awardsResponse.status).toBe(200)
		expect(Array.isArray(awardsResponse.data?.data)).toBe(true)
		expect(awardsResponse.data?.data.some((item) => item.id === awardId)).toBe(true)

		const awardByIdResponse = await getAwardById(state.actor.cookie, awardId!)
		expect(awardByIdResponse.status).toBe(200)
		expect(awardByIdResponse.data?.id).toBe(awardId)
		expect(awardByIdResponse.data?.status).toBe('DRAFT')

		const approveResponse = await updateAwardStatus(state.actor.cookie, awardId!, {
			status: 'APPROVED',
			variant: state.fixture.awardVariantId,
			criteria: state.fixture.awardCriteriaId,
			totalPoints: 0,
		})
		expect(approveResponse.status).toBe(200)
		expect(approveResponse.data?.status).toBe('APPROVED')

		const deleteResponse = await deleteAward(state.actor.cookie, awardId!)
		expect(deleteResponse.status).toBe(400)
		expect(deleteResponse.data).toBeTruthy()
		expect((deleteResponse.data as { error?: string } | null)?.error).toContain('Награду можно удалить')
	} finally {
		await destroyTestState(state)
	}
})
