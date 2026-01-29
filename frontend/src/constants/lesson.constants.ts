import type { ILessonProgress } from '@types'

export const PRACTICE_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационный', startMinute: 5, endMinute: 10, content: [''] },
	{ name: 'Вводный инструктаж', startMinute: 25, endMinute: 30, content: [''] },
	{ name: 'Текущий инструктаж', startMinute: 25, endMinute: 115, content: [''] },
	{ name: 'Заключительный инструктаж', startMinute: 30, endMinute: 110, content: [''] },
	{ name: 'Подведение итогов', startMinute: 5, endMinute: 0, content: [''] },
] as const

export const THEORY_PROGRESS: Omit<ILessonProgress, 'id'>[] = [
	{ name: 'Организационно-мотивационный момент', startMinute: 5, endMinute: 0, content: [''] },
	{ name: 'Актуализация знаний', startMinute: 15, endMinute: 0, content: [''] },
	{
		name: 'Формирование новых знаний и навыков/профессиональных умений',
		startMinute: 40,
		endMinute: 0,
		content: [''],
	},
	{ name: 'Закрепление новой темы', startMinute: 15, endMinute: 0, content: [''] },
	{ name: 'Оценивание', startMinute: 5, endMinute: 0, content: [''] },
	{ name: 'Домашнее задание', startMinute: 3, endMinute: 0, content: [''] },
	{ name: 'Рефлексия', startMinute: 7, endMinute: 0, content: [''] },
] as const
