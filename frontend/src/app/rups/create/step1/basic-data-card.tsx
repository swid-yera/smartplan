'use client'

import { RupTypeEnum, StudyFormEnum } from '@types'
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
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@ui'
import { Info } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { groupData } from '../mock.data'
import type { FormData } from './step1'

interface BasicDataCardProps {
	form: UseFormReturn<FormData>
}

export function BasicDataCard({ form }: BasicDataCardProps) {
	const watchedGroupId = form.watch('groupId')
	const selectedGroup = groupData.find((group) => group.id == watchedGroupId)
	const specialty = selectedGroup?.specialty ?? 'Группа не выбрана'
	const qualification = selectedGroup?.qualification ?? 'Группа не выбрана'

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
							<FormLabel>Наименование модуля</FormLabel>
							<FormControl>
								<Input placeholder='Введите называние модуля' {...field} />
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
								<FormLabel>
									Тип модуля
									<Tooltip>
										<TooltipTrigger asChild>
											<Button size='icon-sm' type='button' variant='ghost'>
												<Info />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{[
												{
													type: RupTypeEnum.PRACTICE,
													desc: 'Для каждой темы будет считаться по 6 часа',
												},
												{
													type: RupTypeEnum.THEORY,
													desc: 'Для каждой темы будет считаться по 2 часа',
												},
											].map((item) => (
												<p key={item.type} className='text-sm'>
													<span className='font-bold'>{item.type}:</span> {item.desc}
												</p>
											))}
										</TooltipContent>
									</Tooltip>
								</FormLabel>
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
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value)
										}}
									>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Выбрать группу' />
										</SelectTrigger>
										<SelectContent position='popper'>
											{groupData.map((group) => (
												<SelectItem key={group.id} value={group.id}>
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

				<p className='text-sm text-primary text-balance mt-6'>
					<Info className='inline mr-2' />
					Информация о квалификации и специальности автоматический получиться от типа группы
				</p>

				{/* qualification & specialty */}
				<div className='grid grid-cols-2 gap-5'>
					<div className='space-y-2'>
						<FormLabel>Специальность</FormLabel>
						<Separator />
						<div className='pt-2 text-muted-foreground'>
							<p>{specialty}</p>
						</div>
					</div>

					<div className='space-y-2'>
						<FormLabel>Квалификация</FormLabel>
						<Separator />
						<div className='pt-2 text-muted-foreground'>
							<p>{qualification}</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
