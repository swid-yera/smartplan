'use client'

import { RupTypeEnum, StudyFormEnum } from '@types'
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
	Separator,
} from '@ui'
import { Info } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { groupData } from '../mock.data'
import type { FormData } from './step1'

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

				<div className='grid grid-cols-2 gap-5'>
					<FormField
						control={form.control}
						name='type'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Тип РУП</FormLabel>
								<FormControl>
									<Select onValueChange={field.onChange} {...field}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Теоретическая или практическая' />
										</SelectTrigger>
										<SelectContent position='popper'>
											{Object.keys(RupTypeEnum).map((rupType) => (
												<SelectItem key={rupType} value={rupType}>
													{RupTypeEnum[rupType]}
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
				</div>

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
											<SelectValue placeholder='Очная или заочная' />
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
						name='groupId'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Выберите группу</FormLabel>
								<FormControl>
									<Select
										onValueChange={(value) => {
											const group = groupData.find((group) => group.id === Number(value))

											form.setValue('groupSpecialty', group?.specialty)
											form.setValue('groupQualification', group?.qualification)

											field.onChange(value)
										}}
										{...field}
									>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Выбрать группу' />
										</SelectTrigger>
										<SelectContent position='popper'>
											{groupData.map((group) => (
												<SelectItem key={group.id} value={String(group.id)}>
													{group.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				<p className='text-sm text-primary text-balance mt-2'>
					<Info className='inline mr-2' />
					Информация о квалификации и специальности автоматический получиться от типа группы
				</p>

				{/* qualification & specialty */}
				<div className='grid grid-cols-2 gap-5'>
					<FormField
						control={form.control}
						name='groupSpecialty'
						render={({ field: { value } }) => (
							<FormItem className='content-start'>
								<FormLabel>Специальность</FormLabel>
								<Separator />
								<FormControl className='text-muted-foreground'>
									<p>{!value ? 'Группа не выбрана' : value}</p>
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='groupQualification'
						render={({ field: { value } }) => (
							<FormItem className='content-start'>
								<FormLabel>Квалификация</FormLabel>
								<Separator />
								<FormControl className='text-muted-foreground'>
									<p>{!value ? 'Группа не выбрана' : value}</p>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>
			</CardContent>
		</Card>
	)
}
