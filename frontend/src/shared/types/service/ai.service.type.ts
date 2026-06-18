import type { RupTypeEnum, StudyFormEnum, TopicTypeEnum } from '../rup.type'

export interface IAiResourceInput {
	name: string
	link?: string
}

export interface IAiDisciplineTopicInput {
	name: string
	type: TopicTypeEnum
	theoryHours: number
	practiceHours: number
	individualHours?: number
	srspHours?: number
	srsHours?: number
}

export interface IAiDisciplineInput {
	name: string
	semesters?: { semester: number; totalHours: number }[]
	topics?: IAiDisciplineTopicInput[]
}

export interface IAiRupGroupInput {
	name: string
	specialty: string
	qualification: string
}

export interface IGenerateRupMeta {
	sourceLanguage?: 'ru' | 'kk'
	name: string
	type: RupTypeEnum
	studyForm: StudyFormEnum
	studyYear: string
	course: number
	group: IAiRupGroupInput
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

export interface IGenerateRupMetaResponse {
	basis: string
	goals: string
	competencies: string
}

export interface IGenerateResources {
	sourceLanguage?: 'ru' | 'kk'
	name: string
	prerequisites: string
	postrequisites: string
	basic: string
	goals: string
	competencies: string
	message?: string
	includeCurrentContent?: boolean
	currentValues?: {
		internetResources?: IAiResourceInput[]
		technicalResources?: IAiResourceInput[]
	}
}

export interface IGenerateResourcesResponse {
	internetResources: IAiResourceInput[]
	technicalResources: IAiResourceInput[]
}

export interface IGenerateDisciplines {
	sourceLanguage?: 'ru' | 'kk'
	name: string
	course: number
	goals: string
	competencies: string
	wantsHours: number
	disciplineCount: number
	message?: string
	includeCurrentContent?: boolean
	currentValues?: {
		disciplines?: IAiDisciplineInput[]
	}
}

export interface IGenerateDisciplinesResponse {
	name: string
	semesters: { semester: number; totalHours: number }[]
	topics: IAiDisciplineTopicInput[]
}

export interface IGenerateTopicsForDiscipline {
	sourceLanguage?: 'ru' | 'kk'
	rupName: string
	rupType: RupTypeEnum
	goals: string
	competencies: string
	disciplineName: string
	disciplineHours: number
	additionalMessage?: string
	includeCurrentContent?: boolean
	currentValues?: {
		topics?: IAiDisciplineTopicInput[]
	}
	currentTopics?: IAiDisciplineTopicInput[]
	preferredPracticalCount?: number
	preferredSnzCount?: number
	preferredCombinedCount?: number
	preferredSrspCount?: number
}

export type IGenerateTopicsForDisciplineResponse = IAiDisciplineTopicInput[]
