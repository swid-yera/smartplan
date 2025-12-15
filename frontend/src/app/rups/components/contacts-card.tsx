'use client'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@ui'
import { Trash } from 'lucide-react'
import {
	type ArrayPath,
	type ControllerRenderProps,
	type FieldValues,
	type Path,
	type PathValue,
	useFieldArray,
	useFormContext,
} from 'react-hook-form'
import { PatternFormat } from 'react-number-format'

type ContactsValues = FieldValues & {
	contacts: { name: string; phone: string; email: string }[]
}

export function ContactsCard<T extends ContactsValues>() {
	const form = useFormContext<T>()

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'contacts' as ArrayPath<T>,
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Контактные данные педагога(ов):</CardTitle>
				<CardDescription>Введите ФИО, номер и электронную почту педагога(ов)</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<div className='space-y-2'>
					{/* Table Header */}
					<div className='grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-1'>
						<FormLabel>ФИО</FormLabel>
						<FormLabel>Номер телефона</FormLabel>
						<FormLabel>Электронная почта</FormLabel>
					</div>

					{/* Table Body */}
					{fields.map((field, index) => (
						<div key={field.id} className='grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start'>
							<FormField
								control={form.control}
								name={`contacts.${index}.name` as Path<T>}
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input placeholder='Иванов Иван Иванович' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`contacts.${index}.phone` as Path<T>}
								render={({ field }) => (
									<FormItem>
										<PhoneInput field={field} />
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name={`contacts.${index}.email` as Path<T>}
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input placeholder='example@mail.com' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button size='icon' type='button' variant='outline' onClick={() => remove(index)}>
								<Trash />
							</Button>
						</div>
					))}
				</div>
				<Button
					type='button'
					variant='outline'
					onClick={() => append({ name: '', phone: '', email: '' } as PathValue<T, ArrayPath<T>>)}
				>
					Добавить педагога
				</Button>
			</CardContent>
		</Card>
	)
}

function PhoneInput<T extends ContactsValues>({ field }: { field: ControllerRenderProps<T, Path<T>> }) {
	return (
		<FormControl>
			<PatternFormat
				{...field}
				customInput={Input}
				format='+7 (###) ###-##-##'
				placeholder='+7 (XXX) XXX-XX-XX'
				onValueChange={({ formattedValue }) => {
					// Update react-hook-form's state with the formatted value
					field.onChange(formattedValue)
				}}
			/>
		</FormControl>
	)
}
