import { RupTypeEnum, StudyFormEnum, TopicTypeEnum } from '@types'
import { z } from 'zod'

const disciplineSchema = z.object({
	name: z.string().min(1, 'Название не может быть пустым'),

	semesters: z
		.array(
			z.object({
				semester: z.number().positive('Номер семестра должен быть положительным'),
				totalHours: z.number().nonnegative('Количество часов не может быть отрицательным'),
			}),
		)
		.min(8, 'должно быть 8 семестров')
		.max(8, 'должно быть 8 семестров'),
})

const disciplineWithTopicsSchema = disciplineSchema.extend({
	topics: z.array(
		z.object({
			name: z.string().min(1, 'Называние занятия не может быть пустым'),
			type: z.enum(TopicTypeEnum, {
				error: () => ({ message: 'Выберите корректный тип занятия' }),
			}),
			theoryHours: z.number().nonnegative('Часы не могут быть отрицательными'),
			practiceHours: z.number().nonnegative('Часы не могут быть отрицательными'),
			individualHours: z.number().nonnegative('Часы не могут быть отрицательными').optional(),
			srspHours: z.number().nonnegative('Часы не могут быть отрицательными').optional(),
			srsHours: z.number().nonnegative('Часы не могут быть отрицательными').optional(),
		}),
	),
})

export const formSchema = z.object({
	// Step 1
	name: z.string().min(1, 'Наименование модуля обязательно'),
	type: z.enum(RupTypeEnum, {
		error: () => ({ message: 'Выберите корректный тип модуля' }),
	}),
	studyForm: z.enum(StudyFormEnum, {
		error: () => ({ message: 'Выберите корректный тип формы обучения' }),
	}),
	studyYear: z.string().min(9, 'Учебный год обязателен').max(9, 'Учебный год обязателен'),
	course: z.number().min(1, 'yes').max(4, 'yes'),
	groupId: z.string().min(1, 'Группа обязательна'),

	// exploration note
	basis: z.string().optional(),
	goals: z.string().optional(),
	competencies: z.string().optional(),
	summary: z.string().optional(),

	prerequisites: z.string().optional(),
	postrequisites: z.string().optional(),

	internetResources: z.array(
		z.object({
			name: z.string().min(1, 'Ресурс не может быть пустым'),
			link: z.string(),
		}),
	),
	technicalResources: z.array(
		z.object({
			name: z.string().min(1, 'Материал не может быть пустым'),
			link: z.string(),
		}),
	),

	// Step 2
	contacts: z.array(z.string().min(1, 'Выберите педагога')).min(1, 'Добавьте как минимум одного педагога'),

	// Step 3 & 4
	disciplines: z.array(disciplineWithTopicsSchema),
})

export type RUPFormData = z.infer<typeof formSchema>
