import type { StatusEnum } from '../global.type'
import type { BackendLocale, LocaleText } from '../locale.type'
import type { RupTypeEnum, StudyFormEnum, TopicTypeEnum } from '../rup.type'
import type { IPaginationRequest } from './global.service.type'

// create
export interface ICreateResource {
	name: LocaleText
	link?: string
}

export interface ICreateExplorationNote {
	basis: LocaleText
	goals: LocaleText
	competencies: LocaleText
	prerequisites: LocaleText
	postrequisites: LocaleText
	internetResources: ICreateResource[]
	technicalResources: ICreateResource[]
}

export interface ICreateSemester {
	semester: number
	totalHours: number
}

export interface ICreateTopic {
	name: LocaleText
	type: TopicTypeEnum
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

export interface ICreateDiscipline {
	name: LocaleText
	semesters: ICreateSemester[]
	topics: ICreateTopic[]
}

export interface ICreateRupRequest {
	name: LocaleText

	type: RupTypeEnum
	course: number
	studyForm: StudyFormEnum
	studyYear: string

	contacts: string[] // IUser.id
	groups: string[] // IGroup.id

	sourceLanguage?: BackendLocale
	explorationNote: ICreateExplorationNote
	disciplines: ICreateDiscipline[]
}

// update
export interface IUpdateRupRequest extends ICreateRupRequest {
	methodist?: string // IUser.keycloakId
}

// download response
export interface IDownloadResponse {
	url: string
}

export interface IRupLanguageGenerationStatus {
	rupId: string
	sourceLanguage: BackendLocale | ''
	targetLanguage: BackendLocale | ''
	status: 'queued' | 'running' | 'completed' | 'failed'
	currentStage: string
	stageIndex: number
	totalStages: number
	progressPercent: number
	error?: string
	updatedAt: string
}

export interface IRegenerateLanguageGenerationRequest {
	id: string
	sourceLanguage?: BackendLocale
}

// get all
export interface IGetAllRequest extends IPaginationRequest {
	methodist?: string
	teacher?: string
	status?: StatusEnum[]
}
