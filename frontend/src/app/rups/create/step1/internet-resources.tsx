'use client'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormField,
	FormItem,
	FormLabel,
	Input,
} from '@ui'
import type { UseFormReturn } from 'react-hook-form'

import type { FormData } from './page'

interface RequisitesCardProps {
	form: UseFormReturn<FormData>
}

export function InternetResourcesCard({ form }: RequisitesCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Учебно-методическое оснащение, справочная литература/интернет-ресурсы</CardTitle>
				<CardDescription>
					Введите список ресурсов откуда был взят материал, <u>ресурс должен быть не старше 5 лет</u>
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<FormField
					control={form.control}
					name='internetResources'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Учебно-методический ресурсы</FormLabel>
							<ol className='space-y-2 list-decimal'>
								{field.value?.map((prereq, index) => (
									<li key={index} className='flex items-center gap-2'>
										<div>{index + 1}</div>
										<Input
											placeholder='Откуда был взят материал для учебного плана'
											value={prereq}
											onChange={(e) => {
												const newValue = [...(field.value || [])]

												newValue[index] = e.target.value
												field.onChange(newValue)
											}}
										/>

										<Button
											size='sm'
											type='button'
											variant='outline'
											onClick={() => {
												const newValue = [...(field.value || [])]

												newValue.splice(index, 1)
												field.onChange(newValue)
											}}
										>
											Удалить
										</Button>
									</li>
								))}

								<Button
									className='mt-5'
									size='sm'
									type='button'
									variant='outline'
									onClick={() => {
										const newValue = [...(field.value || []), '']

										field.onChange(newValue)
									}}
								>
									Добавить ресурс
								</Button>
							</ol>
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
