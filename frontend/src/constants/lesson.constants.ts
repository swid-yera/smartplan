import type { ILessonProgress } from '@types'

export const PRACTICE_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационно-мотивационный момент', firstTime: [5], secondTime: [10], thirdTime: [15], content: [''] },
	{ name: 'Актуализация знаний', firstTime: [15], secondTime: [10], thirdTime: [10], content: [''] },
	{ name: 'Формирование новых знаний и навыков', firstTime: [40], secondTime: [35], thirdTime: [30], content: [''] },
	{ name: 'Закрепление новой темы', firstTime: [15], secondTime: [15], thirdTime: [15], content: [''] },
	{ name: 'Рефлексия', firstTime: [7], secondTime: [8], thirdTime: [8], content: [''] },
	{ name: 'Оценивание', firstTime: [5], secondTime: [7], thirdTime: [7], content: [''] },
	{ name: 'Домашнее задание', firstTime: [3], secondTime: [5], thirdTime: [5], content: [''] },
] as const

export const THEORY_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационно-мотивационный момент', firstTime: [5], secondTime: [10], thirdTime: [15], content: [''] },
	{ name: 'Актуализация знаний', firstTime: [15], secondTime: [10], thirdTime: [10], content: [''] },
	{ name: 'Формирование новых знаний и навыков', firstTime: [40], secondTime: [35], thirdTime: [30], content: [''] },
	{ name: 'Закрепление новой темы', firstTime: [15], secondTime: [15], thirdTime: [15], content: [''] },
	{ name: 'Рефлексия', firstTime: [7], secondTime: [8], thirdTime: [8], content: [''] },
	{ name: 'Оценивание', firstTime: [5], secondTime: [7], thirdTime: [7], content: [''] },
	{ name: 'Домашнее задание', firstTime: [3], secondTime: [5], thirdTime: [5], content: [''] },
] as const
