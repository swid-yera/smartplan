import type { LessonResourceTypeEnum, LessonTypeEnum } from '../lesson.type'
import type { BackendLocale, LocaleText } from '../locale.type'
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
	sourceLanguage?: BackendLocale
	message?: string
	updatedTopic: IGenerateLessonUpdatedTopic
}

export interface IGenerateLessonResponse {
	status: boolean
	lessonId?: string
}

export interface IUpdateLessonResourceRequest {
	id?: string
	name: LocaleText
	link: string
	type: LessonResourceTypeEnum
}

export interface IUpdateLessonProgressRequest {
	id?: string
	step_order?: number
	name?: LocaleText
	content: LocaleText[]
	first_time?: number[]
	second_time?: number[]
	third_time?: number[]
}

export interface IUpdateLessonRequest {
	topic_name: LocaleText
	event_date: string
	sourceLanguage?: BackendLocale
	type: LessonTypeEnum
	goals: LocaleText
	tasks: LocaleText
	expected: LocaleText
	file_url?: string | null
	lesson_progress: IUpdateLessonProgressRequest[]
	internet_resources: IUpdateLessonResourceRequest[]
	technical_resources: IUpdateLessonResourceRequest[]
}
