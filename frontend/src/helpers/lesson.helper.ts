import type { LessonTypeEnum, Locale } from '@types'

// lesson type
const lessonTypeLabelsByLocale: Record<Locale, Record<LessonTypeEnum, string>> = {
	ru: {
		PRACTICE: 'Лабораторно-практическая',
		THEORY: 'Теоретический',
	},
	kk: {
		PRACTICE: 'Зертханалық-практикалық',
		THEORY: 'Теориялық',
	},
}

// backwards-compatible default dictionary
export const lessonTypeLabels: Record<LessonTypeEnum, string> = lessonTypeLabelsByLocale.ru

export const getLessonTypeLabels = (locale: Locale = 'ru'): Record<LessonTypeEnum, string> => {
	return lessonTypeLabelsByLocale[locale] || lessonTypeLabelsByLocale.ru
}

export const normalizeLessonType = (status: LessonTypeEnum, locale: Locale = 'ru'): string => {
	return getLessonTypeLabels(locale)[status] ?? ''
}
