'use client'

import { StudyFormEnum } from '@types'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@ui'
import { Info } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import type { FormData } from '../page'

interface BasicDataCardProps {
	form: UseFormReturn<FormData>
}

export function BasicDataCard({ form }: BasicDataCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Общие сведения</CardTitle>
				<CardDescription>Основные данные рабочего учебного плана.</CardDescription>
			</CardHeader>

			<CardContent className='space-y-3 text-sm'>
				<FormField
					control={form.control}
					name='title'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Наименование РУП</FormLabel>
							<FormControl>
								<Input placeholder='Введите называние учебного плана' {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='year'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Год обучения</FormLabel>
							<FormControl>
								<Select onValueChange={field.onChange} {...field}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Выберите начало года' />
									</SelectTrigger>
									<SelectContent position='popper'>
										{['2025-2026', '2024-2025'].map((studyYears) => (
											<SelectItem key={studyYears} value={studyYears}>
												{studyYears}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					)}
				/>

				<div className='grid grid-cols-2 gap-5'>
					<FormField
						control={form.control}
						name='studyForm'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Форма обучения</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} {...field}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Очная, заочная' />
										</SelectTrigger>
										<SelectContent position='popper'>
											{Object.keys(StudyFormEnum).map((studyForm) => (
												<SelectItem key={studyForm} value={studyForm}>
													{StudyFormEnum[studyForm]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='group'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Выберите группу</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} {...field}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Выбрать группу' />
										</SelectTrigger>
										<SelectContent position='popper'>
											<SelectItem value='WEB24-A'>WEB24-А</SelectItem>
											<SelectItem value='WEB24-B'>WEB24-Б</SelectItem>
											<SelectItem value='WEB23-A'>WEB23-А</SelectItem>
											<SelectItem value='WEB23-B'>WEB23-Б</SelectItem>
										</SelectContent>
									</Select>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				<p className='text-sm text-primary text-balance'>
					<Info className='inline mr-2' />
					Информация о квалификации и специальности автоматический получиться от типа группы
				</p>
			</CardContent>
		</Card>
	)
}
