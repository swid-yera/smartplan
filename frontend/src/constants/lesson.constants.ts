import type { ILessonProgress } from '@types'

export const PRACTICE_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационно-мотивационный момент', first_time: [5], second_time: [5], third_time: [10], content: [''] },
	{ name: 'Актуализация знаний', first_time: [15], second_time: [10], third_time: [20], content: [''] },
	{ name: 'Формирование новых знаний и навыков', first_time: [40], second_time: [40], third_time: [135], content: [''] },
	{ name: 'Закрепление новой темы', first_time: [15], second_time: [20], third_time: [90], content: [''] },
	{ name: 'Рефлексия', first_time: [7], second_time: [5], third_time: [5], content: [''] },
	{ name: 'Оценивание', first_time: [5], second_time: [7], third_time: [7], content: [''] },
	{ name: 'Домашнее задание', first_time: [3], second_time: [3], third_time: [3], content: [''] },
] as const

export const THEORY_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационно-мотивационный момент', first_time: [5], second_time: [5], third_time: [10], content: [''] },
	{ name: 'Актуализация знаний', first_time: [15], second_time: [10], third_time: [20], content: [''] },
	{ name: 'Формирование новых знаний и навыков', first_time: [40], second_time: [40], third_time: [135], content: [''] },
	{ name: 'Закрепление новой темы', first_time: [15], second_time: [20], third_time: [90], content: [''] },
	{ name: 'Рефлексия', first_time: [7], second_time: [5], third_time: [5], content: [''] },
	{ name: 'Оценивание', first_time: [5], second_time: [7], third_time: [7], content: [''] },
	{ name: 'Домашнее задание', first_time: [3], second_time: [3], third_time: [3], content: [''] },
] as const
