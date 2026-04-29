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
