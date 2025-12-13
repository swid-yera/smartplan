'use client'

import * as React from 'react'

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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
} from '@ui'
import { Check, ChevronsUpDown, Info } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { groupData } from '../mock.data'
import type { FormData } from './step1'

interface GroupCardProps {
	form: UseFormReturn<FormData>
}

export function GroupCard({ form }: GroupCardProps) {
	const [open, setOpen] = React.useState(false)
	const watchedGroupId = form.watch('groupId')
	const selectedGroup = groupData.find((group) => group.id == watchedGroupId)
	const specialty = selectedGroup?.specialty ?? 'Группа не выбрана'
	const qualification = selectedGroup?.qualification ?? 'Группа не выбрана'

	return (
		<Card>
			<CardHeader>
				<CardTitle>Группа</CardTitle>
				<CardDescription>Выберите группу и проверьте специальность и квалификацию.</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<div className='grid grid-cols-2 gap-5'>
					<FormField
						control={form.control}
						name='groupId'
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
																form.setValue('groupId', group.id)
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
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='year'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Год обучения</FormLabel>
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger>
										<SelectValue placeholder='Выберите год' />
									</SelectTrigger>
									<SelectContent>
										{['2025-2026', '2024-2025'].map((studyYears) => (
											<SelectItem key={studyYears} value={studyYears}>
												{studyYears}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='course'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Год обучения</FormLabel>
								<Select value={String(field.value)} onValueChange={field.onChange}>
									<SelectTrigger>
										<SelectValue placeholder='Выберите год' />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4].map((courses) => (
											<SelectItem key={courses} value={String(courses)}>
												{courses}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormItem>
						)}
					/>
				</div>
				<p className='text-sm text-primary text-balance'>
					<Info className='inline mr-2' />
					Информация о квалификации и специальности автоматически получиться от типа группы
				</p>
				<div className='space-y-2'>
					<FormLabel>Специальность</FormLabel>
					<Separator />
					<div className='pt-2'>
						<p>{specialty}</p>
					</div>
				</div>
				<div className='space-y-2'>
					<FormLabel>Квалификация</FormLabel>
					<Separator />
					<div className='pt-2'>
						<p>{qualification}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
