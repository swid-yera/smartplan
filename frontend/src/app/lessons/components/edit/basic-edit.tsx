'use client'

import { cn } from '@lib'
import {
	Button,
	Calendar,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@shadcn'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'

type IProps = FieldValues & {
	rupName: string
	eventDate: string
	groups: string[]
	type: string
	// type: LessonTypeEnum
}

export function LessonBasicInfo<T extends IProps>() {
	const { control } = useFormContext<T>()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Основная информация</CardTitle>
			</CardHeader>
			<CardContent className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<FormField
					control={control}
					name={'rupName' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Название РУП</FormLabel>
							<FormControl>
								<Input placeholder='Введите название...' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name={'eventDate' as Path<T>}
					render={({ field }) => (
						<FormItem className='flex flex-col'>
							<FormLabel className='mb-2'>Дата проведения</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											className={cn(
												'w-full pl-3 text-left font-normal',
												!field.value && 'text-muted-foreground',
											)}
											variant='outline'
										>
											{field.value ? format(field.value, 'PPP') : <span>Выберите дату</span>}
											<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-auto p-0'>
									<Calendar mode='single' selected={field.value} onSelect={field.onChange} />
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name={'groups' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Группы (через запятую)</FormLabel>
							<FormControl>
								<Input placeholder='П-1, П-2...' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name={'type' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Тип занятия</FormLabel>
							<FormControl>
								<Input placeholder='Лекция, Лабораторная...' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
