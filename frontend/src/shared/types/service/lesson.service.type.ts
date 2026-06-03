import type { LessonResourceTypeEnum, LessonTypeEnum } from '../lesson.type'
import type { LocaleText } from '../locale.type'
import type { TopicTypeEnum } from '../rup.type'

export interface IGenerateLessonUpdatedTopic {
	name: LocaleText
	type: TopicTypeEnum
	total_hours: number
	theory_hours: number
	practice_hours: number
	individual_hours: number
	srsp_hours: number
	srs_hours: number
}

export interface IGenerateLessonRequest {
	rupId: string
	disciplineId: string
	topicId: string
	updatedTopic: IGenerateLessonUpdatedTopic
}

export interface IGenerateLessonResponse {
	status: boolean
	lessonId?: string
}

export interface IUpdateLessonResourceRequest {
	id?: string
	name: string
	link: string
	type: LessonResourceTypeEnum
}

export interface IUpdateLessonProgressRequest {
	id?: string
	name: LocaleText
	content: string[]
	first_time: number[]
	second_time: number[]
	third_time: number[]
}

export interface IUpdateLessonRequest {
	topic_name: LocaleText
	event_date: string
	type: LessonTypeEnum
	goals: LocaleText
	tasks: LocaleText
	expected: LocaleText
	file_url?: string | null
	lesson_progress: IUpdateLessonProgressRequest[]
	internet_resources: IUpdateLessonResourceRequest[]
	technical_resources: IUpdateLessonResourceRequest[]
}
