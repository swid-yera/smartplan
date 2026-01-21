'use client'

import { type FC, useEffect, useMemo, useState } from 'react'

import type { IUser } from '@types'
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { ChevronsUpDown, Mail, Phone, Trash2, User, UserPlus } from 'lucide-react'
import { type FieldValues, type Path, type PathValue, useFormContext, useWatch } from 'react-hook-form'

type IProps = FieldValues & {
	contacts: string[]
	creatorId: string
	teachersData: IUser[]
}

export function ContactsEdit<T extends IProps>({
	creatorId,
	teachersData,
}: {
	creatorId: string
	teachersData: IUser[]
}) {
	const form = useFormContext<T>()
	const watchedContacts = (useWatch({ control: form.control, name: 'contacts' as Path<T> }) as string[]) || []

	// automatically add creatorId if not present
	useEffect(() => {
		if (creatorId && !watchedContacts.includes(creatorId)) {
			form.setValue('contacts' as Path<T>, [...watchedContacts, creatorId] as PathValue<T, Path<T>>, {
				shouldDirty: false, // usually false for auto-fills, change to true if needed
			})
		}
	}, [creatorId, watchedContacts, form])

	const contactsData = useMemo(() => {
		return watchedContacts.map((id) => teachersData.find((t) => t?.keycloakId === id)).filter(Boolean) as IUser[]
	}, [teachersData, watchedContacts])

	const handleAddTeacher = (id: string) => {
		if (watchedContacts.includes(id)) return
		form.setValue('contacts' as Path<T>, [...watchedContacts, id] as PathValue<T, Path<T>>, {
			shouldDirty: true,
		})
	}

	const handleRemoveTeacher = (id: string) => {
		// prevent user from removing themselves the creator
		if (id === creatorId) return

		const filtered = watchedContacts.filter((contactId) => contactId !== id)

		form.setValue('contacts' as Path<T>, filtered as PathValue<T, Path<T>>, {
			shouldDirty: true,
		})
	}

	return (
		<Card className='overflow-hidden'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0'>
				<div className='space-y-1'>
					<CardTitle className='text-xl'>Педагогический состав</CardTitle>
					<CardDescription>Укажите преподавателей, ответственных за данный план</CardDescription>
				</div>
				<TeacherSelector
					teachersData={teachersData}
					watchedContacts={watchedContacts}
					onSelect={handleAddTeacher}
				/>
			</CardHeader>

			<CardContent className='p-0'>
				{contactsData.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow className='bg-muted/50 hover:bg-muted/50'>
								<TableHead className='w-[40%] pl-6'>ФИО Преподавателя</TableHead>
								<TableHead>Контакты</TableHead>
								<TableHead>Email</TableHead>
								<TableHead className='w-[50px] pr-6' />
							</TableRow>
						</TableHeader>
						<TableBody>
							{contactsData.map((teacher) => {
								const isCreator = teacher.keycloakId === creatorId

								return (
									<TableRow key={teacher.keycloakId} className='group'>
										<TableCell className='pl-6 font-medium'>
											<div className='flex items-center gap-3'>
												<div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
													<User className='h-4 w-4' />
												</div>
												<div className='flex flex-col'>
													<span>
														{teacher.firstName} {teacher.lastName}
													</span>
													{isCreator && (
														<span className='text-[10px] text-primary font-normal'>(Создатель)</span>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<Phone className='h-3 w-3' />
												{teacher.phone || '—'}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<Mail className='h-3 w-3' />
												{teacher.email}
											</div>
										</TableCell>
										<TableCell className='pr-6 text-right'>
											{/* disable button and hide if its the creator */}
											{!isCreator && (
												<Button
													className='opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10'
													size='icon'
													variant='ghost'
													onClick={() => handleRemoveTeacher(teacher.keycloakId)}
												>
													<Trash2 className='h-4 w-4' />
												</Button>
											)}
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				) : (
					<div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
						<div className='rounded-full bg-muted p-4 mb-4'>
							<UserPlus className='h-8 w-8 text-muted-foreground' />
						</div>
						<h3 className='font-medium text-lg'>Список пуст</h3>
						<p className='text-muted-foreground max-w-[300px]'>
							Выберите педагогов из реестра, чтобы они отобразились в этом блоке.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

// teacher selector
interface ITeacherSelector {
	onSelect: (id: string) => void
	teachersData: IUser[]
	watchedContacts: string[]
}

const TeacherSelector: FC<ITeacherSelector> = ({ onSelect, teachersData, watchedContacts }) => {
	const [open, setOpen] = useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button className='w-[220px] justify-between shadow-sm' variant='outline'>
					<UserPlus className='mr-2 h-4 w-4' />
					Выбрать педагога
					<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent align='end' className='w-[350px] p-0' sideOffset={8}>
				<Command>
					<CommandInput placeholder='Поиск по имени или почте...' />
					<CommandList className='max-h-[300px]'>
						<CommandEmpty>Преподаватель не найден.</CommandEmpty>
						<CommandGroup heading='Доступные преподаватели'>
							{teachersData.map((teacher) => {
								const isAdded = watchedContacts.includes(teacher.keycloakId)

								return (
									<CommandItem
										key={teacher.keycloakId}
										className='flex items-center justify-between py-3'
										disabled={isAdded}
										value={teacher.keycloakId}
										onSelect={() => {
											onSelect(teacher.keycloakId)
											setOpen(false)
										}}
									>
										<div className='flex flex-col gap-0.5'>
											<span className='font-medium'>
												{teacher.firstName} {teacher.lastName}
											</span>
											<span className='text-xs text-muted-foreground flex items-center gap-1'>
												<Mail className='h-2 w-2' /> {teacher.email}
											</span>
										</div>
										{isAdded && (
											<span className='text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full'>
												Добавлен
											</span>
										)}
									</CommandItem>
								)
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
