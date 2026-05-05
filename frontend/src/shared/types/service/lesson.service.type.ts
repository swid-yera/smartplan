import type { LessonResourceTypeEnum, LessonTypeEnum } from '../lesson.type'
import type { TopicTypeEnum } from '../rup.type'

export interface IGenerateLessonUpdatedTopic {
	name: string
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

export interface IUpdateLessonRequest {
	topic_name: string
	event_date: string
	type: LessonTypeEnum
	goals: string
	tasks: string
	expected: string
	file_url?: string | null
	internet_resources: IUpdateLessonResourceRequest[]
	technical_resources: IUpdateLessonResourceRequest[]
}
