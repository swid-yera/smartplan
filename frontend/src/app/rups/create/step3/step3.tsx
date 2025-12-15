import type { FC, KeyboardEvent } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form } from '@ui'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { generateTemplateDisciplines } from '@/helpers'

import { DisciplineCard } from './discipline-card'

// form scheme
const formSchema = z.object({
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
		}),
	),
})

export type FormData = z.infer<typeof formSchema>

export const Step3: FC = () => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			disciplines: generateTemplateDisciplines(2, 8),
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
				<DisciplineCard form={form} />

				<Button size='lg' type='submit' variant='default'>
					Сохранить
				</Button>
			</form>
		</Form>
	)
}
