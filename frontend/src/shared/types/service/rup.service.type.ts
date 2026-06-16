import type { StatusEnum } from '../global.type'
import type { BackendLocale, LocaleText } from '../locale.type'
import type { IRupSignatureArtifact } from '../rup.type'
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

export interface IParsedRupPayload {
	sourceLanguage: BackendLocale
	name: LocaleText
	type: RupTypeEnum
	studyForm: StudyFormEnum
	totalHours: number
	courseSuggestion?: number
	studyYearSuggestion?: string
	groupsRaw?: string[]
	specialtyRaw?: string
	qualificationRaw?: string
	developersRaw?: string[]
	explorationNote: ICreateExplorationNote
	disciplines: ICreateDiscipline[]
	warnings?: string[]
}

export interface IParseRupImportResponse {
	importDraftId: string
	payload: IParsedRupPayload
	warnings: string[]
}

export interface IParseRupImportRequest {
	file: File
}

export interface IConfirmRupImportRequest {
	importDraftId: string
	groupId: string
	studyYear: string
	course: 1 | 2 | 3 | 4
}

// update
export interface IUpdateRupRequest extends ICreateRupRequest {
	methodist?: string // IUser.keycloakId
}

export interface IUpdateRupStatusResponse {
	message: string
	artifact?: IRupSignatureArtifact
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

export type IGetRupSignatureArtifactResponse = IRupSignatureArtifact

// get all
export interface IGetAllRequest extends IPaginationRequest {
	methodist?: string
	teacher?: string
	status?: StatusEnum[]
}
