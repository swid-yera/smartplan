'use client'

import { useEffect, useState } from 'react'

import { formatCourseFromYearAndGroupName, generateStudyYears, getGroupYear, getUILocaleSection } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
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
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { IGroup } from '@types'
import { Check, ChevronsUpDown } from 'lucide-react'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import localeDictionary from './locale.json'

type IProps = FieldValues & {
	groupId: string
	studyYear: string
	course: number
}

export function GroupEdit<T extends IProps>() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const form = useFormContext<T>()

	const [selectedGroup, setSelectedGroup] = useState<IGroup | undefined>(undefined)
	const [groupYear, setGroupYear] = useState<number | undefined>()
	const [formattedCourse, setFormattedCourse] = useState<number | undefined>()
	const [open, setOpen] = useState(false)

	const watchedGroupId = form.watch('groupId' as Path<T>)
	const watchedYear = form.watch('studyYear' as Path<T>)

	const { data: groupsData = [], isLoading } = useQuery({ ...services.group.getAllOptions(), enabled: true })

	// set selected group
	useEffect(() => {
		// do nothing if nothing
		if (groupsData.length === 0 || !watchedGroupId) {
			setSelectedGroup(undefined)

			return
		}

		const foundGroup = groupsData.find((g) => g.keycloakId === watchedGroupId)

		if (foundGroup) {
			setSelectedGroup(foundGroup)

			const foundGroupYear = getGroupYear(foundGroup.name)

			if (typeof foundGroupYear === 'number') {
				setGroupYear(foundGroupYear)
			}

			if (watchedYear) {
				const foundCourse = formatCourseFromYearAndGroupName(foundGroup.name, watchedYear)

				if (typeof foundCourse !== 'number') {
					toast.error('Курс не найден, попробуйте с другой группой или обратитесь к администратору')

					return
				}

				setFormattedCourse(foundCourse)
				const numericCourse = typeof foundCourse === 'number' ? foundCourse : 0

				if (form.getValues('course' as Path<T>) !== numericCourse) {
					form.setValue('course' as Path<T>, numericCourse as PathValue<T, Path<T>>)
				}
			}
		}
	}, [groupsData, watchedGroupId, watchedYear, form])

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.groupTitle}</CardTitle>
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
												{field.value && groupsData.length > 0
													? groupsData.find((group) => group.keycloakId === field.value)?.name ||
														'Группа не найдена'
													: isLoading
														? 'Загрузка...'
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

								<Select
									key={field.value}
									disabled={!selectedGroup}
									value={field.value}
									onValueChange={field.onChange}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Выберите год обучения' />
									</SelectTrigger>

									<SelectContent>
										{groupYear &&
											generateStudyYears(groupYear).map((year) => (
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
