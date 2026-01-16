import type { IGroup, IUser } from './global.types'

export enum RupStatusEnum {
	DRAFT = 'DRAFT',
	IN_REVIEW = 'IN_REVIEW',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

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

	name: string
	code: string

	status: RupStatusEnum
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
export interface IResources {
	id: string
	name: string
	link?: string
}

export interface IRupExplorationNote {
	id: string

	basis: string
	goals: string
	summary: string
	competencies: string

	prerequisites: string
	postrequisites: string

	internetResources: IResources[]
	technicalResources: IResources[]
}

// discipline
export interface ISemester {
	id: string
	semester: number
	totalHours: number
}

export interface IDiscipline {
	name: string
	code: string
	totalHours: number
	semesters: ISemester[]
	topics: ITopics[]
}

// topics
export interface ITopics {
	id: string

	name: string
	type: TopicTypeEnum

	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours: number
	srsHours: number
}
