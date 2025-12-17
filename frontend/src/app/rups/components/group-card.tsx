'use client'

import React from 'react'

import { cn } from '@lib'
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@ui'
import { Check, ChevronsUpDown } from 'lucide-react'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'

import { formatCourseFromYearAndGroupName } from '@/helpers'

import { groupData } from '../create/mock.data'

type GroupValues = FieldValues & {
	groupId: string
	year: string
}

export function GroupCard<T extends GroupValues>() {
	const form = useFormContext<T>()

	const [open, setOpen] = React.useState(false)
	const watchedGroupId = form.watch('groupId' as Path<T>)
	const watchedYear = form.watch('year' as Path<T>)

	const selectedGroup = groupData.find((group) => group.id == watchedGroupId)
	const specialty = selectedGroup?.specialty ?? 'Группа не выбрана'
	const qualification = selectedGroup?.qualification ?? 'Группа не выбрана'
	const course =
		selectedGroup?.name && watchedYear
			? formatCourseFromYearAndGroupName(selectedGroup.name, watchedYear)
			: 'Группа или год обучения не выбраны'

	const isCourseError = typeof course === 'string'

	return (
		<Card>
			<CardHeader>
				<CardTitle>Группа</CardTitle>
				<CardDescription>
					Выберите группу и проверьте специальность и квалификацию.
					<span className='text-primary'>
						Информация о квалификации и специальности автоматически получиться от типа группы. Информация о курсе
						получится от года обучения.
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<div className='grid grid-cols-2 gap-5'>
					<FormField
						control={form.control}
						name={'groupId' as Path<T>}
						render={({ field }) => (
							<FormItem className='flex flex-col'>
								<FormLabel>Выберите группу</FormLabel>
								<Popover open={open} onOpenChange={setOpen}>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
												role='combobox'
												variant='outline'
											>
												{field.value
													? groupData.find((group) => group.id === field.value)?.name
													: 'Выбрать группу...'}
												<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent align='center' className='w-[--radix-popover-trigger-width] p-0'>
										<Command>
											<CommandInput placeholder='Поиск группы...' />
											<CommandList>
												<CommandEmpty>Группа не найдена.</CommandEmpty>
												<CommandGroup>
													{groupData.map((group) => (
														<CommandItem
															key={group.id}
															value={group.name}
															onSelect={() => {
																form.setValue('groupId' as Path<T>, group.id as PathValue<T, Path<T>>)
																form.setValue('year' as Path<T>, '' as PathValue<T, Path<T>>) // Reset year on group change
																setOpen(false)
															}}
														>
															<Check
																className={cn(
																	'mr-2 h-4 w-4',
																	group.id === field.value ? 'opacity-100' : 'opacity-0',
																)}
															/>
															{group.name}
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

					<FormField
						control={form.control}
						name={'year' as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Год обучения</FormLabel>
								<Select disabled={!watchedGroupId} value={field.value} onValueChange={field.onChange}>
									<SelectTrigger>
										<SelectValue placeholder='Выберите год' />
									</SelectTrigger>
									<SelectContent>
										{['2026-2027', '2025-2026', '2024-2025', '2023-2024', '2022-2023'].map((studyYears) => (
											<SelectItem key={studyYears} value={studyYears}>
												{studyYears}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div>
					<p>Специальность</p>
					<p>{specialty}</p>
				</div>
				<div>
					<p>Квалификация</p>
					<p>{qualification}</p>
				</div>
				<div>
					<p>Курс</p>
					<p className={cn({ 'text-destructive': isCourseError })}>{course}</p>
				</div>
			</CardContent>
		</Card>
	)
}
