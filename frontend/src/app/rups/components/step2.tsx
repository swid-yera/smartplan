import type { FC } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Form } from '@ui'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { ContactsCard } from './contacts-card'
import { ResourceListCard } from './resource-list-card'

// Regex for Kazakhstan phone number: +7 (7XX) XXX-XX-XX
const kzPhoneRegex = /^\+7\s?\([7][0-9]{2}\)\s?[0-9]{3}-[0-9]{2}-[0-9]{2}$/

// form scheme
const formSchema = z.object({
	// developers
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
	// resources
	internetResources: z
		.array(
			z.object({
				value: z.string().min(1, 'Ресурс не может быть пустым'),
				link: z.string().optional(),
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
})

export type FormData = z.infer<typeof formSchema>

export const Step2: FC = () => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			contacts: [
				{
					email: '',
					name: '',
					phone: '',
				},
			],
			// resources
			internetResources: [{ value: '' }],
			technicalResources: [{ value: '' }],
		},
	})

	const onSave = (values: z.infer<typeof formSchema>) => {
		console.log('save', values)
	}

	return (
		<Form {...form}>
			<form className='w-full space-y-5' onSubmit={form.handleSubmit(onSave)}>
				<ContactsCard />

				<div className='grid md:grid-cols-2 gap-4'>
					{/* internet  */}
					<ResourceListCard
						buttonText='Добавить ресурс'
						description={
							<>
								Введите список ресурсов откуда был взят материал, <u>ресурс должен быть не старше 5 лет</u>
							</>
						}
						label='Учебно-методический ресурсы'
						name='internetResources'
						placeholder='Откуда был взят материал для учебного плана'
						title='Учебно-методическое оснащение, справочная литература/интернет-ресурсы'
					/>

					{/* technical */}
					<ResourceListCard
						buttonText='Добавить материал'
						description='Введите список технических средств которые обязательны для учебного плана'
						label='Технические средства и материалы'
						name='technicalResources'
						placeholder='Что нужно при прохождении учебного плана'
						title='Технические средства и материалы'
					/>
				</div>

				<Button size='lg' type='submit' variant='default'>
					Сохранить
				</Button>
			</form>
		</Form>
	)
}
