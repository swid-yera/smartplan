import type { ILesson, TopicTypeEnum } from '@types'

export type ILessonContext = ILesson & {
	rup_id?: string
	rupId?: string
	discipline_id?: string
	disciplineId?: string
	topic_id?: string
	topicId?: string
	topic_type?: TopicTypeEnum
	topicType?: TopicTypeEnum
	theory_hours?: number
	theoryHours?: number
	practice_hours?: number
	practiceHours?: number
	individual_hours?: number
	individualHours?: number
	srsp_hours?: number
	srspHours?: number
	srs_hours?: number
	srsHours?: number
	lesson_progress?: ILessonProgressContext[]
}

export type ILessonProgressContext = {
	id?: string
	name?: string
	content?: string[] | string
	firstTime?: number[] | string[]
	secondTime?: number[] | string[]
	thirdTime?: number[] | string[]
}

export type INormalizedLessonProgress = {
	id: string
	name: string
	content: string[]
	firstTime: number
	secondTime: number
	thirdTime: number
}

export type IRegenerateFormData = {
	name: string
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours: number
	srsHours: number
	type: TopicTypeEnum
}
