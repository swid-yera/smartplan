'use client'

import { useEffect, useState } from 'react'

import { formatCourseFromYearAndGroupName, generateStudyYears } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import type { IGroup } from '@types'
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

type IProps = FieldValues & {
	groupId: string
	studyYear: string
	course: number
}

const generatedStudyYears = generateStudyYears(6)

export function GroupEdit<T extends IProps>() {
	const form = useFormContext<T>()

	const [selectedGroup, setSelectedGroup] = useState<IGroup | undefined>(undefined)
	const [formattedCourse, setFormattedCourse] = useState<number | string | undefined>('')
	const [open, setOpen] = useState(false)
	const watchedGroupId = form.watch('groupId' as Path<T>)
	const watchedYear = form.watch('studyYear' as Path<T>)

	const {
		data: groupsData = [],
		isLoading,
		isSuccess,
	} = useQuery({ ...services.group.getAllOptions(), enabled: true })

	// set selected group
	useEffect(() => {
		if (isLoading || !isSuccess || !watchedGroupId) return

		const foundGroup = groupsData.find((g) => g.keycloakId == watchedGroupId)

		if (!foundGroup) return
		setSelectedGroup(foundGroup)

		if (!watchedYear) return
		const foundCourse = formatCourseFromYearAndGroupName(foundGroup.name, watchedYear)

		setFormattedCourse(foundCourse)
		form.setValue('course' as Path<T>, (typeof foundCourse === 'number' ? foundCourse : 0) as PathValue<T, Path<T>>)
	}, [isSuccess, isLoading, groupsData, watchedGroupId, watchedYear])

	return (
		<Card>
			<CardHeader>
				<CardTitle>Группа</CardTitle>
				<CardDescription>
					Выберите группу и проверьте специальность и квалификацию.
					<span className='text-primary '>
						Информация о квалификации и специальности автоматически получиться от типа группы. Данные о курсе
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
													? groupsData.find((group) => group.keycloakId === field.value)?.name
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
													{groupsData.map((group) => (
														<CommandItem
															key={group.keycloakId}
															value={group.name}
															onSelect={() => {
																form.setValue(
																	'groupId' as Path<T>,
																	group.keycloakId as PathValue<T, Path<T>>,
																)
																setOpen(false)
															}}
														>
															<Check
																className={cn(
																	'mr-2 h-4 w-4',
																	group.keycloakId === field.value ? 'opacity-100' : 'opacity-0',
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
						name={'studyYear' as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Год обучения</FormLabel>

								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Выберите год обучения' />
									</SelectTrigger>

									<SelectContent>
										{generatedStudyYears.map((year) => (
											<SelectItem key={year} value={year}>
												{year}
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
					<p>{selectedGroup?.specialty}</p>
				</div>
				<div>
					<p>Квалификация</p>
					<p>{selectedGroup?.qualification}</p>
				</div>
				<div>
					<p>Курс</p>
					<p className={cn({ 'text-destructive': typeof formattedCourse != 'number' })}>{formattedCourse}</p>
				</div>
			</CardContent>
		</Card>
	)
}
