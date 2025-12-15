import type { IGroup, IUser } from './global-types'

export enum RupModuleStatus {
	DRAFT = 'Черновик',
	IN_REVIEW = 'На согласовании',
	APPROVED = 'утверждён',
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
	id: number
	title: string
	studyForm: StudyFormEnum
	totalHours: number
	hours: IHours
	explorationNote: IRupModuleExplorationNote
	developersName: string[]
	years: string
	type: RupModuleTypeEnum

	disciplines: IDiscipline[]
	group: IGroup
	methodist: IUser
	department: IUser
	status: RupModuleStatus
}

// rup exploration note
export interface IResources {
	name: string
	link: string
}

export interface IRupModuleExplorationNote {
	according: string
	goals: string
	competencies: string
	prerequisites: IRupModule
	postrequisites: IRupModule
	internetResources: IResources[]
	technicalResources: IResources[]
	contacts: IUser[]
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
