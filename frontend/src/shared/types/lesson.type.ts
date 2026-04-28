export enum LessonTypeEnum {
	PRACTICE = 'PRACTICE',
	THEORY = 'THEORY',
}

export interface ILesson {
	id: string
	rup_name: string
	discipline_name: string
	topic_name: string
	teacher_id: string
	group_id: string
	event_date: string
	type: LessonTypeEnum

	goals: string
	tasks: string
	expected: string

	internet_resources: string[]
	technical_resources: string[]
	file_url: string
	created_at: string
	updated_at: string
}

export interface ILessonProgress {
	id: string
	name: string
	content: string[]

	startMinute: number
	endMinute: number
}
