import type { IGroup, IUser } from './global-types'

enum RupModuleStatus {
	DRAFT = 'DRAFT',
	IN_REVIEW = 'IN_REVIEW',
	APPROVED = 'APPROVED',
}

// rup
enum StudyFormEnum {
	Correspondence = 'заочная',
	FullTime = 'очная',
}

interface IHours {
	theoryHours: number
	practiceHours: number
	individualHours: number
}

enum RupModuleTypeEnum {
	PRACTICE = 'Учебно производственная практика',
	THEORY = 'Теоретическая',
}

interface IRupModule {
	id: string
	title: string
	studyForm: StudyFormEnum
	totalHours: number
	hours: IHours
	explorationNote: IRupModuleExplorationNote
	developersName: string[]
	year: string
	type: RupModuleTypeEnum

	disciplines: IDiscipline[]
	group: IGroup
	methodist: IUser
	department: IUser
	status: RupModuleStatus
}

// rup exploration note
interface IResources {
	name: string
	link: string
}

interface IRupModuleExplorationNote {
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
interface ISemester {
	semester: number
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
}

interface IDiscipline {
	name: string
	code: string
	totalHours: number
	semesters: ISemester[]
	topics: ITopics[]
}

// topics
enum TopicTypeEnum {
	SNZ = 'СНЗ',
	Practical = 'практическое',
	Combined = 'комбинированный',
}

interface ITopics {
	name: string
	type: TopicTypeEnum
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	SRSP: number
	SRS: number
}
