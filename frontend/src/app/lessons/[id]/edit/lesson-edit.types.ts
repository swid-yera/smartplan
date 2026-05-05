import type { LessonTypeEnum } from '@types'

export type IResourceRow = {
	id?: string
	name: string
	link: string
}

export type ILessonProgressRow = {
	id?: string
	name: string
	startMinute: number
	endMinute: number
	contentText: string
}

export type ILessonFormState = {
	topicName: string
	type: LessonTypeEnum
	eventDate: Date | undefined
	eventTime: string
	goals: string
	tasks: string
	expected: string
	fileUrl: string
	lessonProgress: ILessonProgressRow[]
	internetResources: IResourceRow[]
	technicalResources: IResourceRow[]
}
