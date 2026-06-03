import type { LessonTypeEnum, Locale } from '@types'

export type IResourceRow = {
	id?: string
	name: Record<Locale, string>
	link: string
}

export type ILessonProgressRow = {
	id?: string
	name: Record<Locale, string>
	firstTime: number
	secondTime: number
	thirdTime: number
	contentText: string
}

export type ILessonFormState = {
	topicName: Record<Locale, string>
	type: LessonTypeEnum
	eventDate: Date | undefined
	eventTime: string
	goals: Record<Locale, string>
	tasks: Record<Locale, string>
	expected: Record<Locale, string>
	fileUrl: string
	lessonProgress: ILessonProgressRow[]
	internetResources: IResourceRow[]
	technicalResources: IResourceRow[]
}
