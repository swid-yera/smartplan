import type { FC, KeyboardEvent } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form } from '@ui'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { RupModuleTypeEnum } from '@/shared/types'

import { disciplineData } from '../mock.data'
import { TopicsCard } from './topics-card'

// form scheme
const formSchema = z.object({
	rupModuleType: z.string().min(1, 'Тип РУП не может быть пустым'),
	// disciplines
	disciplines: z.array(
		z.object({
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
		}),
	),
})

export type FormData = z.infer<typeof formSchema>

export const Step4: FC = () => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		shouldUnregister: false,
		defaultValues: {
			disciplines: disciplineData,
			rupModuleType: RupModuleTypeEnum.THEORY,
		},
	})

	const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
		// Prevent form submission on "Enter" key press in input fields
		if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
			e.preventDefault()
		}
	}

	const onSave = (values: z.infer<typeof formSchema>) => {
		console.log('save', values)
	}

	return (
		<Form {...form}>
			<form className='w-full space-y-5' onKeyDown={handleKeyDown} onSubmit={form.handleSubmit(onSave)}>
				<TopicsCard form={form} />

				<Button size='lg' type='submit' variant='default'>
					Сохранить
				</Button>
			</form>
		</Form>
	)
}
