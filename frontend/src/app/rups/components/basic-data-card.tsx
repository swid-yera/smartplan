'use client'

import { normalizeRupType, normalizeStudyForm } from '@helpers'
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
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@ui'
import { Info } from 'lucide-react'
import type { FieldValues, Path } from 'react-hook-form'
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
	const { control } = useFormContext<T>()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Общие сведения</CardTitle>
				<CardDescription>Основные данные модуля рабочего учебного плана.</CardDescription>
			</CardHeader>

			<CardContent className='space-y-3 text-sm'>
				<div className='grid gap-5 sm:grid-cols-[minmax(0.3,0.5fr)_minmax(1,2fr)]'>
					<FormField
						control={control}
						name={'code' as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex items-center'>Код</FormLabel>
								<FormControl>
									<Input placeholder='Код' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

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
				</div>

				<div className='grid lg:grid-cols-[minmax(1,2fr)_minmax(0.6,0.8fr)] gap-5'>
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
				<FormField
					control={control}
					name={'prerequisites' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel className='flex items-center'>Пререквизиты</FormLabel>
							<FormControl>
								<Input placeholder='Пререквизиты' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name={'postrequisites' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel className='flex items-center'>Постреквизиты</FormLabel>
							<FormControl>
								<Input placeholder='Постреквизиты' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}

const rupTypeTips: Record<RupTypeEnum, string> = {
	PRACTICE: 'Для каждой темы будет считаться по 6 часа',
	THEORY: 'Для каждой темы будет считаться по 2 часа',
}
