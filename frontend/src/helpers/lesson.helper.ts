import type { LessonTypeEnum } from '@types'

// lesson type
export const lessonTypeLabels: Record<LessonTypeEnum, string> = {
	PRACTICE: 'Лабораторно-практическая',
	THEORY: 'Теоретический',
}

export const normalizeLessonType = (status: LessonTypeEnum): string => {
	return lessonTypeLabels[status] ?? ''
}

// normalize lesson minutes
export const normalizeLessonMinutes = (startMinute: number, endMinute: number): string => {
	// with end minute
	if (endMinute != 0) {
		return `(${startMinute} мин. / ${endMinute} мин.)`
	}

	return `(${startMinute} мин.)`
}
