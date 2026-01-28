import type { IGroup, IResources, IUser } from './global.types'

export enum LessonTypeEnum {
	PRACTICE = 'PRACTICE',
	THEORY = 'THEORY',
}

export interface ILesson {
	id: string
	rupName: string
	disciplineName: string
	topicName: string
	type: LessonTypeEnum

	progress: ILessonProgress[]
	goals: string
	tasks: string
	expected: string

	eventDate: string
	teacher: IUser
	group: IGroup

	internetResources: IResources[]
	technicalResources: IResources[]

	createdAt: string
	updatedAt: string
}

interface ILessonProgress {
	id: string
	name: string
	content: string[]

	startMinute: number[]
	endMinute: number[]
}
