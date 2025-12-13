'use client'

import React from 'react'

import { RupTypeEnum, StudyFormEnum } from '@types'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@ui'
import { Check, ChevronsUpDown, Info } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib'

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
										<TooltipTrigger type='button'>
											<Info size='14' />
										</TooltipTrigger>
										<TooltipContent side='top'>
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
													<span className='font-bold'>{item.type}:</span>
													<br />
													{item.desc}
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
				</div>

				{/* requisites */}
				<div className='grid grid-cols-2 gap-5'>
					<RequisiteField form={form} label='Пререквизиты' type='prerequisites' />
					<RequisiteField form={form} label='Постреквизиты' type='postrequisites' />
				</div>
			</CardContent>
		</Card>
	)
}

// requisite field
type RequisiteType = 'prerequisites' | 'postrequisites'

interface RequisiteFieldProps {
	form: UseFormReturn<FormData>
	type: RequisiteType
	label: string
}

// mock data
const modules = [
	{ value: 'Основы программирования', label: 'Основы программирования' },
	{ value: 'Базы данных', label: 'Базы данных' },
	{ value: 'Веб-технологии', label: 'Веб-технологии' },
	{ value: 'Алгоритмы и структуры данных', label: 'Алгоритмы и структуры данных' },
	{ value: 'Компьютерные сети', label: 'Компьютерные сети' },
]

function RequisiteField({ form, type, label }: RequisiteFieldProps) {
	const [open, setOpen] = React.useState(false)

	const otherType = type === 'prerequisites' ? 'postrequisites' : 'prerequisites'
	const otherValue = form.watch(otherType)

	const availableModules = modules.filter((module) => module.value !== otherValue)

	return (
		<FormField
			control={form.control}
			name={type}
			render={({ field }) => (
				<FormItem className='flex flex-col'>
					<FormLabel>{label}</FormLabel>
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<FormControl>
								<Button
									className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
									role='combobox'
									variant='outline'
								>
									{field.value
										? modules.find((module) => module.value === field.value)?.label
										: 'Выбрать модуль...'}
									<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
								</Button>
							</FormControl>
						</PopoverTrigger>
						<PopoverContent align='center' className='w-[--radix-popover-trigger-width] p-0'>
							<Command>
								<CommandInput placeholder='Поиск модуля...' />
								<CommandList>
									<CommandEmpty>Модуль не найден.</CommandEmpty>
									<CommandGroup>
										{availableModules.map((module) => (
											<CommandItem
												key={module.value}
												value={module.label}
												onSelect={() => {
													form.setValue(type, module.value)
													setOpen(false)
												}}
											>
												<Check
													className={cn(
														'mr-2 h-4 w-4',
														module.value === field.value ? 'opacity-100' : 'opacity-0',
													)}
												/>
												{module.label}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</FormItem>
			)}
		/>
	)
}
