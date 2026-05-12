import { api } from '@lib'
import { type IGroup, RupTypeEnum, type StudyFormEnum, TopicTypeEnum } from '@types'
import { isAxiosError } from 'axios'

type ResourceInput = {
	name: string
	link?: string
}

type DisciplineTopicInput = {
	name: string
	type: TopicTypeEnum
	theoryHours: number
	practiceHours: number
	individualHours?: number
	srspHours?: number
	srsHours?: number
}

type DisciplineInput = {
	name: string
	semesters?: { semester: number; totalHours: number }[]
	topics?: DisciplineTopicInput[]
}

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

// generate rup meta
export interface IGenerateRupMeta {
	name: string
	type: RupTypeEnum
	studyForm: StudyFormEnum
	studyYear: string
	course: number
	group: IGroup
	prerequisites: string
	postrequisites: string
	message?: string
	includeCurrentContent?: boolean
	currentValues?: {
		description?: string
		goals?: string
		competence?: string
		basis?: string
		competencies?: string
	}
}

export async function generateRupMeta(baseData: IGenerateRupMeta) {
	try {
		const { data } = await api.post('/ai/rups/meta', baseData)

		return data
	} catch (e) {
		console.error('failed to generate rups meta data:', e)
		throw new Error(getErrorMessage(e, 'Не удалось сгенерировать метаданные'))
	}
}

// generate resources
export interface IGenerateResources {
	name: string
	prerequisites: string
	postrequisites: string
	basic: string
	goals: string
	competencies: string
	message?: string
	includeCurrentContent?: boolean
	currentValues?: {
		internetResources?: ResourceInput[]
		technicalResources?: ResourceInput[]
	}
}

export async function generateResources(baseData: IGenerateResources) {
	try {
		const { data } = await api.post('/ai/rups/resources', baseData)

		return data
	} catch (e) {
		console.error('failed to generate rups resources data:', e)
		throw new Error(getErrorMessage(e, 'Не удалось сгенерировать ресурсы'))
	}
}

// generate rup disciplines
export interface IGenerateDisciplines {
	name: string
	course: number
	goals: string
	competencies: string
	wantsHours: number
	disciplineCount: number
	message?: string
	includeCurrentContent?: boolean
	currentValues?: {
		disciplines?: DisciplineInput[]
	}
}

export async function generateDisciplines(baseData: IGenerateDisciplines) {
	try {
		const { data } = await api.post('/ai/rups/disciplines', baseData)

		return data
	} catch (e) {
		console.error('failed to generate rups disciplines:', e)
		throw new Error(getErrorMessage(e, 'Ошибка распределения часов'))
	}
}

// generate topics for one discipline (do loop)
export interface IGenerateTopicsForDiscipline {
	rupName: string
	rupType: RupTypeEnum
	goals: string
	competencies: string
	disciplineName: string
	disciplineHours: number
	additionalMessage?: string
	includeCurrentContent?: boolean
	currentValues?: {
		topics?: DisciplineTopicInput[]
	}
	currentTopics?: DisciplineTopicInput[]
	preferredPracticalCount?: number
	preferredSnzCount?: number
	preferredCombinedCount?: number
}

export async function generateTopicsForDiscipline(baseData: IGenerateTopicsForDiscipline) {
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
		const { data } = await api.post('/ai/rups/topics', payload)

		return data
	} catch (e) {
		console.error(`Ошибка в темах для ${baseData.disciplineName}:`, e)

		return []
	}
}
