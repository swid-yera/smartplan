import type {
	IDiscipline,
	IResources,
	IRup,
	IRupExplorationNote,
	ISemester,
	ITopics,
	RupTypeEnum,
	StudyFormEnum,
} from '../rup.types'

// create
export type ICreateResource = Omit<IResources, 'id'>

export type ICreateExplorationNote = Omit<IRupExplorationNote, 'id' | 'internetResources' | 'technicalResources'> & {
	internetResources: ICreateResource[]
	technicalResources: ICreateResource[]
}

export type ICreateSemester = Omit<ISemester, 'id'>

export type ICreateTopic = Omit<ITopics, 'id' | 'totalHours'>

export type ICreateDiscipline = Omit<IDiscipline, 'totalHours' | 'semesters' | 'topics'> & {
	semesters: ICreateSemester[]
	topics: ICreateTopic[]
}

export interface ICreateRequest {
	name: string
	code: string

	type: RupTypeEnum
	course: 1 | 2 | 3 | 4
	studyForm: StudyFormEnum
	studyYear: string

	contacts: string[] // IUser.id
	groups: string[] // IGroup.id

	explorationNote: ICreateExplorationNote
	disciplines: ICreateDiscipline[]
}

// update
export interface IUpdateRequest extends ICreateRequest {
	methodist?: string // IUser.keycloak_id
}

// update status
export interface IUpdateStatusRequest {
	id: IRup['id'] // IUser.keycloak_id
	status: IRup['status'] // IUser.keycloak_id
	reason?: IRup['reason']
}
