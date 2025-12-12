export enum RupStatus {
	DRAFT = 'Черновик',
	IN_REVIEW = 'На согласовании',
	APPROVED = 'утверждён',
}

export interface IGroup {
	id: string
	name: string
	specialty: string
	qualification: string
}

export interface IUser {
	name: string
	secondName: string
	roles: string[] // TODO:
	phone: string
	email: string
}

// rup
export enum StudyFormEnum {
	Correspondence = 'заочная',
	FullTime = 'очная',
}

export interface ICredits {
	theoryCredits: number
	practiceCredits: number
	individualCredits: number
}

export enum RupTypeEnum {
	PRACTICE = 'Учебно производственная практика',
	THEORY = 'Теоретическая',
}

export interface IRup {
	id: number
	title: string
	studyForm: StudyFormEnum
	totalCredits: number
	credits: ICredits
	explorationNote: IRupExplorationNote
	developersName: string[]
	years: string
	type: RupTypeEnum

	disciplines: IDiscipline[]
	group: IGroup
	methodist: IUser
	department: IUser
	status: RupStatus
}

// rup exploration note
export interface IResources {
	name: string
	link: string
}

export interface IRupExplorationNote {
	according: string
	goals: string
	competencies: string
	prerequisites: IRup
	postrequisites: IRup
	internetResources: IResources[]
	technicalResources: IResources[]
	contacts: IUser[]
}

// discipline
export interface ISemester {
	semester: number
	credits: number // TODO:
	theoryCredits: number
	practiceCredits: number
	individualCredits: number
}

export interface IDiscipline {
	name: string
	code: string
	totalCredits: number
	semesters: ISemester[]
	topics: ITopics[]
}

// topics
export enum TopicTypeEnum {
	Theoretical = 'теоретическое',
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
}
