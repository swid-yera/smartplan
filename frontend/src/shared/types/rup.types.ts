import type { IGroup, IUser } from './global.types'

export enum RupModuleStatus {
	DRAFT = 'DRAFT',
	IN_REVIEW = 'IN_REVIEW',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

// rup
export enum StudyFormEnum {
	Correspondence = 'заочная',
	FullTime = 'очная',
}

export interface IHours {
	theoryHours: number
	practiceHours: number
	individualHours: number
}

export enum RupModuleTypeEnum {
	PRACTICE = 'Учебно производственная практика',
	THEORY = 'Теоретическая',
}

export interface IRupModule {
	id: string
	status: RupModuleStatus
	title: string
	studyForm: StudyFormEnum
	explorationNote: string
	goals: string
	prerequisites: string
	postrequisites: string
	internetResources: IResources[]
	technicalResources: IResources[]
	contacts: IUser[]
	year: string
	type: RupModuleTypeEnum

	disciplines: IDiscipline[]
	group: IGroup
}

// rup exploration note
export interface IResources {
	value: string
}

// discipline
export interface ISemester {
	semester: number
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
}

export interface IDiscipline {
	name: string
	code: string
	totalHours: number
	semesters: ISemester[]
	topics: ITopics[]
}

// topics
export enum TopicTypeEnum {
	SNZ = 'СНЗ',
	Practical = 'практическое',
	Combined = 'комбинированный',
}

export interface ITopics {
	name: string
	type: TopicTypeEnum
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	SRSP: number
	SRS: number
}
