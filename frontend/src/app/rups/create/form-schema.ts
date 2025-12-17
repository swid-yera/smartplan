import { z } from 'zod'

import { formatCourseFromYearAndGroupName } from '@/helpers'

import { groupData } from './mock.data'

// Regex for Kazakhstan phone number: +7 (7XX) XXX-XX-XX
const kzPhoneRegex = /^\+7\s?\([7][0-9]{2}\)\s?[0-9]{3}-[0-9]{2}-[0-9]{2}$/

const disciplineSchema = z.object({
	code: z.string().min(1, 'Код не может быть пустым'),
	name: z.string().min(1, 'Название не может быть пустым'),
	totalHours: z.number().nonnegative('Количество часов не может быть отрицательным'),
	semesters: z
		.array(
			z.object({
				semester: z.number().positive('Номер семестра должен быть положительным'),
				hours: z.number().nonnegative('Количество часов не может быть отрицательным'),
			}),
		)
		.min(1, 'У дисциплины должен быть как минимум один семестр'),
})

const disciplineWithTopicsSchema = disciplineSchema.extend({
	topics: z
		.array(
			z.object({
				name: z.string(), // Allow empty name as in mock data
				type: z.string().min(1, 'Тип занятия не может быть пустым'),
				totalHours: z.number().nonnegative('Часы не могут быть отрицательными'),
				theoryHours: z.number().nonnegative('Часы не могут быть отрицательными'),
				practiceHours: z.number().nonnegative('Часы не могут быть отрицательными'),
				individualHours: z.number().nonnegative('Часы не могут быть отрицательными'),
				srspHours: z.number().nonnegative('Часы не могут быть отрицательными').optional(),
				srsHours: z.number().nonnegative('Часы не могут быть отрицательными').optional(),
			}),
		)
		.min(1, 'У дисциплины должен быть как минимум одна тема'),
})

export const formSchema = z
	.object({
		// Step 1
		title: z.string().min(1, 'Наименование модуля обязательно'),
		type: z.string().min(1, 'Тип Модуля обязателен'),
		studyForm: z.string().min(1, 'Форма обучения обязательна'),
		explorationNote: z.string().optional(),
		goals: z.string().optional(),
		prerequisites: z.string().optional(),
		postrequisites: z.string().optional(),
		year: z.string().min(1, 'Учебный год обязателен'),
		groupId: z.string().min(1, 'Группа обязательна'),

		// Step 2
		contacts: z
			.array(
				z.object({
					name: z
						.string()
						.min(1, 'ФИО не может быть пустым')
						.refine((val) => val.trim().split(/\s+/).length >= 2, {
							message: 'Введите как минимум имя и фамилию',
						}),
					phone: z.string().min(1, 'Номер телефона не может быть пустым').regex(kzPhoneRegex, {
						message: 'Неверный формат номера. Ожидается: +7 (7XX) XXX-XX-XX',
					}),
					email: z.string().min(1, 'Email не может быть пустым').email('Неверный формат email адреса'),
				}),
			)
			.min(1, 'Добавьте как минимум одного педагога'),
		internetResources: z
			.array(
				z.object({
					value: z.string().min(1, 'Ресурс не может быть пустым'),
				}),
			)
			.optional(),
		technicalResources: z
			.array(
				z.object({
					value: z.string().min(1, 'Материал не может быть пустым'),
					link: z.string().optional(),
				}),
			)
			.optional(),

		// Step 3 & 4
		disciplines: z.array(disciplineWithTopicsSchema),
	})
	.superRefine((data, ctx) => {
		// From Step 1
		if (data.groupId && data.year) {
			const selectedGroup = groupData.find((group) => group.id === data.groupId)

			if (selectedGroup) {
				const course = formatCourseFromYearAndGroupName(selectedGroup.name, data.year)

				if (typeof course === 'string') {
					ctx.addIssue({
						code: 'custom',
						message: course,
						path: ['groupId'],
					})
				}
			}
		}
	})

export type RUPFormData = z.infer<typeof formSchema>
