import * as z from 'zod'
import { LessonTypeEnum } from '@types'

const resourceSchema = z.object({
	name: z.string().min(1, 'Название обязательно'),
	link: z.string().url('Некорректная ссылка').or(z.string().length(0)),
})

const progressSchema = z.object({
	name: z.string().min(1, 'Название этапа обязательно'),
	startMinute: z.number(),
	endMinute: z.number(),
	content: z.array(z.string().min(1, 'Заполните контент')),
})

export const lessonSchema = z.object({
	rupName: z.string().min(1, 'Название РУП обязательно'),
	disciplineName: z.string().optional(),
	topicName: z.string().optional(),
	eventDate: z.date(),
	groups: z.string().min(1, 'Укажите хотя бы одну группу'),
	type: z.enum(LessonTypeEnum, {
		error: () => ({ message: 'Выберите корректный тип урока' }),
	}),
	goals: z.string().optional(),
	tasks: z.string().optional(),
	expected: z.string().optional(),
	lessonProgress: z.array(progressSchema),
	internetResources: z.array(resourceSchema),
	technicalResources: z.array(resourceSchema),
})

export type LessonFormData = z.infer<typeof lessonSchema>
