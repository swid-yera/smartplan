import type { IGroup, RoleEnum } from './global.type'

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
	name: string
	link: string
	type: LessonResourceTypeEnum
}

export interface ILessonProgress {
	id: string
	name: string
	content: string[]
	firstTime: number[]
	secondTime: number[]
	thirdTime: number[]
}

export interface ILesson {
	id: string
	rup_name: string
	discipline_name: string
	topic_name: string
	plan_number: number
	teacher: ILessonTeacher
	group: IGroup
	teacher_id?: string
	group_id?: string
	event_date: string
	type: LessonTypeEnum

	goals: string
	tasks: string
	expected: string

	lesson_progress: ILessonProgress[]
	internet_resources: ILessonResource[]
	technical_resources: ILessonResource[]
	file_url: string | null
	created_at: string
	updated_at: string
}
