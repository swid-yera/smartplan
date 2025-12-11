'use client'

import { Button, Card, CardContent, CardHeader, CardTitle, FormField, FormItem, FormLabel, Input, Separator } from '@ui'
import type { UseFormReturn } from 'react-hook-form'

import type { FormData } from './page'

interface RequisitesCardProps {
	form: UseFormReturn<FormData>
}

export function RequisitesCard({ form }: RequisitesCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Пререквизиты и постреквизиты</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<FormField
					control={form.control}
					name='prerequisites'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Пререквизиты</FormLabel>
							<div className='space-y-2'>
								{field.value?.map((prereq, index) => (
									<div key={index} className='flex items-center gap-2'>
										<Input
											placeholder='Какие дисциплины или модули должны быть освоены'
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
									</div>
								))}
								<Button
									className='mt-4'
									size='sm'
									type='button'
									variant='outline'
									onClick={() => {
										const newValue = [...(field.value || []), '']

										field.onChange(newValue)
									}}
								>
									Добавить пререквизиты
								</Button>
							</div>
						</FormItem>
					)}
				/>

				<Separator />

				<FormField
					control={form.control}
					name='postrequisites'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Постреквизиты</FormLabel>
							<div className='space-y-2'>
								{field.value?.map((postrequisites, index) => (
									<div key={index} className='flex items-center gap-2'>
										<Input
											placeholder='Какие уровни, модули или программы следуют после'
											value={postrequisites}
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
									</div>
								))}
								<Button
									className='mt-4'
									size='sm'
									type='button'
									variant='outline'
									onClick={() => {
										const newValue = [...(field.value || []), '']

										field.onChange(newValue)
									}}
								>
									Добавить постреквизиты
								</Button>
							</div>
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
