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

export function TechnicalResourcesCard({ form }: RequisitesCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Технические средства и материалы</CardTitle>
				<CardDescription>Введите список технических средств которые обязательны для учебного плана</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<FormField
					control={form.control}
					name='technicalResources'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Технические средства и материалы</FormLabel>
							<ol className='space-y-2 list-decimal'>
								{field.value?.map((prereq, index) => (
									<li key={index} className='flex items-center gap-2'>
										<div>{index + 1}</div>
										<Input
											placeholder='Что нужно при прохождении учебного плана'
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
									Добавить материал
								</Button>
							</ol>
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
