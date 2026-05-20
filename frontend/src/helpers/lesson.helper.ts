import type { LessonTypeEnum } from '@types'

// lesson type
export const lessonTypeLabels: Record<LessonTypeEnum, string> = {
	PRACTICE: 'Лабораторно-практическая',
	THEORY: 'Теоретический',
}

export const normalizeLessonType = (status: LessonTypeEnum): string => {
	return lessonTypeLabels[status] ?? ''
}
