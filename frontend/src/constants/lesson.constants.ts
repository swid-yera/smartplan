import type { ILessonProgress } from '@types'

export const PRACTICE_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационно-мотивационный момент', firstTime: [5], secondTime: [5], thirdTime: [10], content: [''] },
	{ name: 'Актуализация знаний', firstTime: [15], secondTime: [10], thirdTime: [20], content: [''] },
	{ name: 'Формирование новых знаний и навыков', firstTime: [40], secondTime: [40], thirdTime: [135], content: [''] },
	{ name: 'Закрепление новой темы', firstTime: [15], secondTime: [20], thirdTime: [90], content: [''] },
	{ name: 'Рефлексия', firstTime: [7], secondTime: [5], thirdTime: [5], content: [''] },
	{ name: 'Оценивание', firstTime: [5], secondTime: [7], thirdTime: [7], content: [''] },
	{ name: 'Домашнее задание', firstTime: [3], secondTime: [3], thirdTime: [3], content: [''] },
] as const

export const THEORY_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационно-мотивационный момент', firstTime: [5], secondTime: [5], thirdTime: [10], content: [''] },
	{ name: 'Актуализация знаний', firstTime: [15], secondTime: [10], thirdTime: [20], content: [''] },
	{ name: 'Формирование новых знаний и навыков', firstTime: [40], secondTime: [40], thirdTime: [135], content: [''] },
	{ name: 'Закрепление новой темы', firstTime: [15], secondTime: [20], thirdTime: [90], content: [''] },
	{ name: 'Рефлексия', firstTime: [7], secondTime: [5], thirdTime: [5], content: [''] },
	{ name: 'Оценивание', firstTime: [5], secondTime: [7], thirdTime: [7], content: [''] },
	{ name: 'Домашнее задание', firstTime: [3], secondTime: [3], thirdTime: [3], content: [''] },
] as const
