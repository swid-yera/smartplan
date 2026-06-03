import type { IGroup, IUser, StatusEnum } from './global.type'
import type { LocalizedText } from './locale.type'

export enum StudyFormEnum {
	CORRESPONDENCE = 'CORRESPONDENCE',
	FULL_TIME = 'FULL_TIME',
}

export enum RupTypeEnum {
	PRACTICE = 'PRACTICE',
	THEORY = 'THEORY',
}

export enum TopicTypeEnum {
	SNZ = 'SNZ',
	PRACTICAL = 'PRACTICAL',
	COMBINED = 'COMBINED',
}

// rup
export interface IHours {
	theoryHours: number
	practiceHours: number
	individualHours: number
}

export interface IRup {
	id: string
	name: LocalizedText

	status: StatusEnum
	reason?: string

	type: RupTypeEnum
	studyForm: StudyFormEnum
	studyYear: string
	totalHours: number

	course: 1 | 2 | 3 | 4
	groups: IGroup[]

	methodist?: IUser
	teacher: IUser // creator

	explorationNote: IRupExplorationNote
	contacts: IUser[]
	disciplines: IDiscipline[]

	createdAt: string
	updatedAt: string
}

// rup exploration note
export interface IRupExplorationNote {
	id: string

	basis: LocalizedText
	goals: LocalizedText
	competencies: LocalizedText

	prerequisites: LocalizedText
	postrequisites: LocalizedText

	internetResources: IRupResource[]
	technicalResources: IRupResource[]
}

export interface IRupResource {
	id: string
	name: LocalizedText
	link?: string
	type?: string
}

// discipline
export interface ISemester {
	id: string
	semester: number
	totalHours: number
}

export interface IDiscipline {
	name: LocalizedText
	totalHours: number
	semesters: ISemester[]
	topics: ITopics[]
}

// topics
export interface ITopics {
	id: string

	name: LocalizedText
	type: TopicTypeEnum

	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours: number
	srsHours: number
}
