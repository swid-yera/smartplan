import type { IGroup, RoleEnum } from './global.type'
import type { LocalizedText } from './locale.type'

export enum LessonTypeEnum {
	PRACTICE = 'PRACTICE',
	THEORY = 'THEORY',
}

export enum LessonResourceTypeEnum {
	INTERNET = 'INTERNET',
	TECHNICAL = 'TECHNICAL',
}

export interface ILessonTeacher {
	keycloakId: string
	email: string
	username: string
	firstName: string
	lastName: string
	phone: string
	roles: RoleEnum | string
}

export interface ILessonResource {
	id: string
	name: LocalizedText
	link: string
	type: LessonResourceTypeEnum
}

export interface ILessonNavigation {
	id: string
	topic_name: LocalizedText
}

export interface ILessonProgress {
	id: string
	name: LocalizedText
	content: LocalizedText[]
	firstTime: number[]
	secondTime: number[]
	thirdTime: number[]
	first_time?: number[]
	second_time?: number[]
	third_time?: number[]
}

export interface ILesson {
	id: string
	rup_id?: string
	rupId?: string
	discipline_id?: string
	disciplineId?: string
	topic_id?: string
	topicId?: string
	rup_name: LocalizedText
	discipline_name: LocalizedText
	topic_name: LocalizedText
	plan_number: number
	teacher: ILessonTeacher
	group: IGroup
	teacher_id?: string
	group_id?: string
	event_date: string
	type: LessonTypeEnum

	goals: LocalizedText
	tasks: LocalizedText
	expected: LocalizedText

	lesson_progress: ILessonProgress[]
	internet_resources: ILessonResource[]
	technical_resources: ILessonResource[]
	file_url: string | null
	previous_lesson?: ILessonNavigation
	next_lesson?: ILessonNavigation
	previousLesson?: ILessonNavigation
	nextLesson?: ILessonNavigation
	created_at: string
	updated_at: string
}
