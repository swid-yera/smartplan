'use client'

import React from 'react'

import { normalizeRupType, normalizeStudyForm } from '@helpers'
import { cn } from '@lib'
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
	FormMessage,
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
import type { FieldValues, Path, PathValue } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'

// Define a base shape for the form data that this component needs.
// Any form passed to this component must have at least these fields.
type BasicDataValues = FieldValues & {
	name: string
	code: string
	type: RupTypeEnum
	studyForm: StudyFormEnum
	prerequisites?: string
	postrequisites?: string
}

export function BasicDataCard<T extends BasicDataValues>() {
	const { control, getValues } = useFormContext<T>()

	console.log(getValues())

	return (
		<Card>
			<CardHeader>
				<CardTitle>Общие сведения</CardTitle>
				<CardDescription>Основные данные модуля рабочего учебного плана.</CardDescription>
			</CardHeader>

			<CardContent className='space-y-3 text-sm'>
				<FormField
					control={control}
					name={'name' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel className='flex items-center'>Наименование модуля</FormLabel>
							<FormControl>
								<Input placeholder='Введите называние модуля' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className='grid grid-cols-2 gap-5'>
					<FormField
						control={control}
						name={'type' as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex items-center'>
									Тип модуля
									<Tooltip>
										<TooltipTrigger className='ml-1' type='button'>
											<Info size='14' />
										</TooltipTrigger>
										<TooltipContent side='top'>
											{Object.entries(rupTypeTips).map((obj) => (
												<p key={obj[0]}>
													<span className='font-bold'>{normalizeRupType(obj[0] as RupTypeEnum)}:</span>
													<br />
													{obj[1]}
												</p>
											))}
										</TooltipContent>
									</Tooltip>
								</FormLabel>
								<FormControl>
									<Select value={field.value ?? ''} onValueChange={field.onChange}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Теоретическая или практическая' />
										</SelectTrigger>
										<SelectContent position='popper'>
											{Object.keys(RupTypeEnum).map((rupType) => (
												<SelectItem key={rupType} value={RupTypeEnum[rupType]}>
													{normalizeRupType(rupType as RupTypeEnum)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name={'studyForm' as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex items-center'>Форма обучения</FormLabel>
								<FormControl>
									<Select value={field.value ?? ''} onValueChange={field.onChange}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder='Очная или заочная' />
										</SelectTrigger>
										<SelectContent position='popper'>
											{Object.keys(StudyFormEnum).map((studyForm) => (
												<SelectItem key={studyForm} value={studyForm}>
													{normalizeStudyForm(studyForm as StudyFormEnum)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* requisites */}
				<div className='grid grid-cols-2 gap-5'>
					<RequisiteField label='Пререквизиты' type='prerequisites' />
					<RequisiteField label='Постреквизиты' type='postrequisites' />
				</div>
			</CardContent>
		</Card>
	)
}

const rupTypeTips: Record<RupTypeEnum, string> = {
	PRACTICE: 'Для каждой темы будет считаться по 6 часа',
	THEORY: 'Для каждой темы будет считаться по 2 часа',
}

// requisite field
type RequisiteType = 'prerequisites' | 'postrequisites'

interface RequisiteFieldProps<T extends BasicDataValues> {
	type: RequisiteType
	label: string
}

// mock data
const modules = [
	{ value: 'ПМ6 Основы программирования', label: 'Основы программирования' },
	{ value: 'ПМ5 Базы данных', label: 'Базы данных' },
	{ value: 'ПМ7 Веб-технологии', label: 'Веб-технологии' },
	{ value: 'ОП5 Алгоритмы и структуры данных', label: 'Алгоритмы и структуры данных' },
	{ value: 'ОП6 Компьютерные сети', label: 'Компьютерные сети' },
]

function RequisiteField<T extends BasicDataValues>({ type, label }: RequisiteFieldProps<T>) {
	const { control, watch, setValue, formState, resetField } = useFormContext<T>()
	const [open, setOpen] = React.useState(false)

	const otherValue = watch(type as Path<T>)

	const availableModules = modules.filter((module) => module.value !== otherValue)

	return (
		<FormField
			control={control}
			name={type as Path<T>}
			render={({ field }) => (
				<FormItem className='flex flex-col'>
					<FormLabel className='flex items-center'>{label}</FormLabel>
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
													setValue(type as Path<T>, module.value as PathValue<T, Path<T>>)
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
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
