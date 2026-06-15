import { type Locale, RupTypeEnum, StudyFormEnum, TopicTypeEnum } from '@types'
import { z } from 'zod'

const schemaMessages: Record<
	Locale,
	{
		ruRequired: string
		kkRequired: string
		semesterPositive: string
		hoursNonNegative: string
		semestersRequired: string
		topicTypeInvalid: string
		moduleTypeInvalid: string
		studyFormInvalid: string
		studyYearRequired: string
		groupRequired: string
		teacherRequired: string
		atLeastOneTeacher: string
	}
> = {
	ru: {
		ruRequired: 'Заполните поле на русском языке',
		kkRequired: 'Заполните поле на казахском языке',
		semesterPositive: 'Номер семестра должен быть положительным',
		hoursNonNegative: 'Количество часов не может быть отрицательным',
		semestersRequired: 'Должно быть 8 семестров',
		topicTypeInvalid: 'Выберите корректный тип занятия',
		moduleTypeInvalid: 'Выберите корректный тип модуля',
		studyFormInvalid: 'Выберите корректный тип формы обучения',
		studyYearRequired: 'Учебный год обязателен',
		groupRequired: 'Группа обязательна',
		teacherRequired: 'Выберите педагога',
		atLeastOneTeacher: 'Добавьте как минимум одного педагога',
	},
	kk: {
		ruRequired: 'Орыс тіліндегі өрісті толтырыңыз',
		kkRequired: 'Қазақ тіліндегі өрісті толтырыңыз',
		semesterPositive: 'Семестр нөмірі оң болуы керек',
		hoursNonNegative: 'Сағат саны теріс болмауы керек',
		semestersRequired: '8 семестр болуы керек',
		topicTypeInvalid: 'Сабақтың дұрыс түрін таңдаңыз',
		moduleTypeInvalid: 'Модульдің дұрыс түрін таңдаңыз',
		studyFormInvalid: 'Оқу түрінің дұрыс мәнін таңдаңыз',
		studyYearRequired: 'Оқу жылы міндетті',
		groupRequired: 'Топ міндетті',
		teacherRequired: 'Педагогты таңдаңыз',
		atLeastOneTeacher: 'Кемінде бір педагог қосыңыз',
	},
}

export const createRupFormSchema = (locale: Locale = 'ru', requiredLocales: Locale[] = ['ru', 'kk']) => {
	const m = schemaMessages[locale] ?? schemaMessages.ru
	const localeSet = new Set(requiredLocales)
	const localeTextSchema = z
		.object({
			ru: z.string().trim(),
			kz: z.string().trim(),
		})
		.superRefine((value, ctx) => {
			if (localeSet.has('ru') && !value.ru) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: m.ruRequired,
					path: ['ru'],
				})
			}

			if (localeSet.has('kk') && !value.kz) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: m.kkRequired,
					path: ['kz'],
				})
			}
		})

	const optionalLocaleTextSchema = z.object({
		ru: z.string().trim(),
		kz: z.string().trim(),
	})

	const disciplineSchema = z.object({
		name: localeTextSchema,

		semesters: z
			.array(
				z.object({
					semester: z.number().positive(m.semesterPositive),
					totalHours: z.number().nonnegative(m.hoursNonNegative),
				}),
			)
			.min(8, m.semestersRequired)
			.max(8, m.semestersRequired),
	})

	const disciplineWithTopicsSchema = disciplineSchema.extend({
		topics: z.array(
			z.object({
				name: localeTextSchema,
				type: z.enum(TopicTypeEnum, {
					error: () => ({ message: m.topicTypeInvalid }),
				}),
				theoryHours: z.number().nonnegative(m.hoursNonNegative),
				practiceHours: z.number().nonnegative(m.hoursNonNegative),
				individualHours: z.number().nonnegative(m.hoursNonNegative).optional(),
				srspHours: z.number().nonnegative(m.hoursNonNegative).optional(),
				srsHours: z.number().nonnegative(m.hoursNonNegative).optional(),
			}),
		),
	})

	return z.object({
		// Step 1
		name: localeTextSchema,
		type: z.enum(RupTypeEnum, {
			error: () => ({ message: m.moduleTypeInvalid }),
		}),
		studyForm: z.enum(StudyFormEnum, {
			error: () => ({ message: m.studyFormInvalid }),
		}),
		studyYear: z.string().min(9, m.studyYearRequired).max(9, m.studyYearRequired),
		course: z.number().min(1, 'yes').max(4, 'yes'),
		groupId: z.string().min(1, m.groupRequired),

		prerequisites: optionalLocaleTextSchema,
		postrequisites: optionalLocaleTextSchema,

		// exploration note
		basis: localeTextSchema,
		goals: localeTextSchema,
		competencies: localeTextSchema,

		// Step 2
		contacts: z.array(z.string().min(1, m.teacherRequired)).min(1, m.atLeastOneTeacher),

		internetResources: z.array(
			z.object({
				name: localeTextSchema,
				link: z.string().optional(),
			}),
		),
		technicalResources: z.array(
			z.object({
				name: localeTextSchema,
				link: z.string().optional(),
			}),
		),

		// Step 3 & 4
		disciplines: z.array(disciplineWithTopicsSchema),
	})
}

export const rupFormSchema = createRupFormSchema('ru')

export type RUPFormData = z.infer<ReturnType<typeof createRupFormSchema>>
