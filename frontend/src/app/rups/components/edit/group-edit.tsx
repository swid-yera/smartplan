'use client'

import { useEffect, useState } from 'react'

import {
	formatCourseFromYearAndGroupName,
	generateStudyYears,
	getGroupYear,
	getLocaleText,
	getUILocaleSection,
} from '@helpers'
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
					toast.error(t.group.courseNotFound)

					return
				}

				setFormattedCourse(foundCourse)
				const numericCourse = typeof foundCourse === 'number' ? foundCourse : 0

				if (form.getValues('course' as Path<T>) !== numericCourse) {
					form.setValue('course' as Path<T>, numericCourse as PathValue<T, Path<T>>)
				}
			}
		}
	}, [groupsData, watchedGroupId, watchedYear, form, t.group.courseNotFound])

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.groupTitle}</CardTitle>
				<CardDescription>
					{t.group.description}
					<span className='text-primary '>{t.group.descriptionAccent}</span>
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<div className='grid grid-cols-2 gap-5'>
					<FormField
						control={form.control}
						name={'groupId' as Path<T>}
						render={({ field }) => (
							<FormItem className='flex flex-col'>
								<FormLabel>{t.group.groupLabel}</FormLabel>
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
														t.group.groupNotFound
													: isLoading
														? t.group.loading
														: t.group.selectGroup}
												<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent align='center' className='w-[--radix-popover-trigger-width] p-0'>
										<Command>
											<CommandInput placeholder={t.group.searchGroup} />
											<CommandList>
												<CommandEmpty>{t.group.groupNotFoundCommand}</CommandEmpty>
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
								<FormLabel>{t.group.studyYearLabel}</FormLabel>

								<Select
									key={field.value}
									disabled={!selectedGroup}
									value={field.value}
									onValueChange={field.onChange}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder={t.group.studyYearPlaceholder} />
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
					<p>{t.group.specialty}</p>
					<p>{getLocaleText(selectedGroup?.specialty, locale)}</p>
				</div>
				<div>
					<p>{t.group.qualification}</p>
					<p>{getLocaleText(selectedGroup?.qualification, locale)}</p>
				</div>
				<div>
					<p>{t.group.course}</p>
					<p className={cn({ 'text-destructive': typeof formattedCourse != 'number' })}>{formattedCourse}</p>
				</div>
			</CardContent>
		</Card>
	)
}
