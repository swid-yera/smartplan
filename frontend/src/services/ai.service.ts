import { api } from '@lib'
import type {
	IGenerateDisciplines,
	IGenerateDisciplinesResponse,
	IGenerateResources,
	IGenerateResourcesResponse,
	IGenerateRupMeta,
	IGenerateRupMetaResponse,
	IGenerateTopicsForDiscipline,
	IGenerateTopicsForDisciplineResponse,
} from '@types'
import { isAxiosError } from 'axios'

function getErrorMessage(error: unknown, fallbackMessage: string): string {
	if (isAxiosError(error)) {
		const details = error.response?.data?.details
		const messageFromResponse = error.response?.data?.error

		if (typeof details === 'string' && details.trim()) return details
		if (typeof messageFromResponse === 'string' && messageFromResponse.trim()) return messageFromResponse
		if (typeof error.message === 'string' && error.message.trim()) return error.message
	}

	if (error instanceof Error && error.message.trim()) return error.message

	return fallbackMessage
}

export class AiService {
	async generateRupMeta(baseData: IGenerateRupMeta) {
		try {
			const { data } = await api.post<IGenerateRupMetaResponse>('/ai/rups/meta', baseData)

			return data
		} catch (e) {
			console.error('failed to generate rups meta data:', e)
			throw new Error(getErrorMessage(e, 'Не удалось сгенерировать метаданные'))
		}
	}

	async generateResources(baseData: IGenerateResources) {
		try {
			const { data } = await api.post<IGenerateResourcesResponse>('/ai/rups/resources', baseData)

			return data
		} catch (e) {
			console.error('failed to generate rups resources data:', e)
			throw new Error(getErrorMessage(e, 'Не удалось сгенерировать ресурсы'))
		}
	}

	async generateDisciplines(baseData: IGenerateDisciplines) {
		try {
			const { data } = await api.post<IGenerateDisciplinesResponse[]>('/ai/rups/disciplines', baseData)

			return data
		} catch (e) {
			console.error('failed to generate rups disciplines:', e)
			throw new Error(getErrorMessage(e, 'Ошибка распределения часов'))
		}
	}

	async generateTopicsForDiscipline(baseData: IGenerateTopicsForDiscipline) {
		const payload = {
			rupName: baseData.rupName,
			rupType: baseData.rupType,
			goals: baseData.goals,
			competencies: baseData.competencies,
			disciplineName: baseData.disciplineName,
			disciplineHours: baseData.disciplineHours,
			message: baseData.additionalMessage ?? '',
			includeCurrentContent: baseData.includeCurrentContent,
			currentValues:
				baseData.currentValues ?? (baseData.currentTopics ? { topics: baseData.currentTopics } : undefined),
			preferredPracticalCount: baseData.preferredPracticalCount,
			preferredSnzCount: baseData.preferredSnzCount,
			preferredCombinedCount: baseData.preferredCombinedCount,
		}

		try {
			const { data } = await api.post<IGenerateTopicsForDisciplineResponse>('/ai/rups/topics', payload)

			return data
		} catch (e) {
			console.error(`Ошибка в темах для ${baseData.disciplineName}:`, e)

			return []
		}
	}
}
