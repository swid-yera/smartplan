'use client'

import { useEffect, useMemo, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { Forbidden, Loader, PageTitle } from '@components'
import { CATEGORY_ICON_OPTIONS, hasRole } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	ButtonGroup,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Textarea,
} from '@shadcn'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import type {
	CategoryFieldType,
	IApiErrorResponse,
	ICategoryFieldRequest,
	ICategoryRequest,
	ICategoryResponse,
} from '@types'
import { RoleEnum } from '@types'
import { isAxiosError } from 'axios'
import { Check, ChevronsUpDown, Minus, Plus, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const FIELD_TYPE_OPTIONS: CategoryFieldType[] = ['text', 'textarea', 'number', 'select', 'date', 'file', 'url']

const createEmptyField = (sortOrder: number): ICategoryFieldRequest => ({
	key: '',
	label: '',
	type: 'text',
	required: false,
	placeholder: '',
	helpText: '',
	options: [],
	validation: {},
	sortOrder,
})

const mapCategoryToFormFields = (category: ICategoryResponse): ICategoryFieldRequest[] => {
	return (category.fieldsExpanded || []).map((field, index) => ({
		key: field.key,
		label: field.label,
		type: field.type,
		required: field.required,
		placeholder: field.placeholder || '',
		helpText: field.helpText || '',
		options: field.options || [],
		validation: field.validation || {},
		sortOrder: index + 1,
	}))
}

const Page = () => {
	const { id } = useParams<{ id: string }>()
	const { replace } = useRouter()
	const { user, authLoading } = useAuthStore()

	const [name, setName] = useState('')
	const [iconName, setIconName] = useState('')
	const [description, setDescription] = useState('')
	const [awardTypeIds, setAwardTypeIds] = useState<string[]>([])
	const [isAwardTypesOpen, setIsAwardTypesOpen] = useState(false)
	const [fields, setFields] = useState<ICategoryFieldRequest[]>([])
	const [isInitialized, setIsInitialized] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const { data: category, isLoading: isCategoryLoading } = useQuery({
		...services.categories.getByIdOptions(id),
		enabled: !!id,
	})

	const { data: awardTypes } = useQuery({
		...services.award.getAllTypesOptions(),
		enabled: true,
	})

	const updateMutation = useMutation({
		...services.categories.updateOptions(),
	})
	const deleteMutation = useMutation({
		...services.categories.deleteMutationOptions(),
	})

	const isAdmin = user ? hasRole(user.role, RoleEnum.ADMIN) : false
	const isPageLoading = authLoading || isCategoryLoading

	useEffect(() => {
		if (!category || isInitialized) return

		setName(category.name || '')
		setIconName(category.icon || '')
		setDescription(category.description || '')
		setAwardTypeIds(category.awardTypes || [])
		setFields(mapCategoryToFormFields(category))
		setIsInitialized(true)
	}, [category, isInitialized])

	const selectedAwardTypes =
		awardTypes
			?.filter((awardType) => awardTypeIds.includes(awardType.id))
			.sort((a, b) => a.name.localeCompare(b.name)) || []

	const toggleAwardType = (typeId: string) => {
		setAwardTypeIds((prev) => (prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]))
	}

	const addField = () => {
		setFields((prev) => [...prev, createEmptyField(prev.length + 1)])
	}

	const removeField = (index: number) => {
		setFields((prev) =>
			prev
				.filter((_, currentIndex) => currentIndex !== index)
				.map((field, currentIndex) => ({ ...field, sortOrder: currentIndex + 1 })),
		)
	}

	const updateField = (index: number, patch: Partial<ICategoryFieldRequest>) => {
		setFields((prev) => prev.map((field, currentIndex) => (currentIndex === index ? { ...field, ...patch } : field)))
	}

	const categoryPayload = useMemo<ICategoryRequest>(
		() => ({
			name: name.trim(),
			icon: iconName || undefined,
			description: description.trim() || undefined,
			awardTypes: awardTypeIds,
			fields: fields.map((field, index) => ({
				...field,
				key: field.key.trim(),
				label: field.label.trim(),
				placeholder: field.placeholder?.trim() || undefined,
				helpText: field.helpText?.trim() || undefined,
				sortOrder: index + 1,
			})),
		}),
		[awardTypeIds, description, fields, iconName, name],
	)

	const handleSubmit = () => {
		if (!category) return

		if (!categoryPayload.name) {
			toast.error('Название категории обязательно')

			return
		}

		const invalidField = categoryPayload.fields.find((field) => !field.key.trim() || !field.label.trim())

		if (invalidField) {
			toast.error('У каждого поля должны быть key и label')

			return
		}

		const toastId = `update-category-${category.id}`

		toast.loading(`Сохранение категории ${categoryPayload.name}`, { id: toastId })

		updateMutation.mutate(
			{ id: category.id, changedCategory: categoryPayload },
			{
				onSuccess: (updatedCategory) => {
					toast.success(`Категория ${updatedCategory.name} успешно обновлена`, { id: toastId })
					replace(`/kpi/categories/${updatedCategory.id}`)
				},
				onError: (error) => {
					let errorMessage = 'Ошибка обновления категории'

					if (isAxiosError<IApiErrorResponse>(error)) {
						errorMessage = error.response?.data?.error || error.message || errorMessage
					} else if (error instanceof Error) {
						errorMessage = error.message
					}

					toast.error('Ошибка при обновлении категории', {
						id: toastId,
						description: errorMessage,
					})
				},
			},
		)
	}

	const handleDelete = () => {
		if (!category) return

		const toastId = `delete-category-${category.id}`

		toast.loading(`Удаление категории ${category.name}`, { id: toastId })

		deleteMutation.mutate(category.id, {
			onSuccess: () => {
				toast.success(`Категория ${category.name} удалена`, { id: toastId })
				replace('/kpi/categories')
			},
			onError: (error) => {
				let errorMessage = 'Ошибка удаления категории'

				if (isAxiosError<IApiErrorResponse>(error)) {
					errorMessage = error.response?.data?.error || error.message || errorMessage
				} else if (error instanceof Error) {
					errorMessage = error.message
				}

				toast.error('Ошибка при удалении категории', {
					id: toastId,
					description: errorMessage,
				})
			},
		})
	}

	if (isPageLoading) return <Loader type='data' />
	if (!user || !isAdmin) return <Forbidden />
	if (!category) return <p className='p-6 text-center text-muted-foreground'>Категория не найдена</p>

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle
				sticky
				actions={
					<>
						<Button
							className='hover:text-muted-foreground'
							variant='outline'
							onClick={() => replace(`/kpi/categories/${category.id}`)}
						>
							Отменить
						</Button>
						<ButtonGroup>
							<Button
								className='hover:text-destructive'
								variant='outline'
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Удалить
							</Button>
							<Button
								className='hover:text-primary'
								disabled={updateMutation.isPending}
								variant='outline'
								onClick={handleSubmit}
							>
								<Save className='mr-2 h-4 w-4' />
								Сохранить
							</Button>
						</ButtonGroup>
					</>
				}
				backHref={`/kpi/categories/${category.id}`}
				description='Редактирование категории KPI'
			>
				Редактирование категории
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>Редактирование: {category.name}</CardTitle>
					<CardDescription>Измените основные данные и поля формы категории</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Название *</Label>
							<Input
								id='name'
								placeholder='Например: Публикации'
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='icon'>Иконка</Label>
							<Select
								value={iconName || 'none'}
								onValueChange={(value) => setIconName(value === 'none' ? '' : value)}
							>
								<SelectTrigger id='icon'>
									<SelectValue placeholder='Выберите иконку' />
								</SelectTrigger>
								<SelectContent className='w-[220px]'>
									<div className='grid grid-cols-4 gap-1 p-1'>
										<SelectItem
											className='h-10 w-10 justify-center p-0 pr-0'
											textValue='Без иконки'
											value='none'
										>
											<Minus aria-hidden='true' className='h-4 w-4' />
											<span className='sr-only'>Без иконки</span>
										</SelectItem>
										{CATEGORY_ICON_OPTIONS.map((option) => (
											<SelectItem
												key={option.name}
												className='h-10 w-10 justify-center p-0 pr-0'
												textValue={option.label}
												value={option.name}
											>
												<option.Icon aria-hidden='true' className='h-4 w-4' />
												<span className='sr-only'>{option.label}</span>
											</SelectItem>
										))}
									</div>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>Описание</Label>
						<Textarea
							id='description'
							placeholder='Короткое описание категории'
							value={description}
							onChange={(event) => setDescription(event.target.value)}
						/>
					</div>

					<Separator />

					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<h3 className='font-semibold'>Типы наград</h3>
							<Badge variant='outline'>{awardTypeIds.length} выбрано</Badge>
						</div>

						<Popover open={isAwardTypesOpen} onOpenChange={setIsAwardTypesOpen}>
							<PopoverTrigger asChild>
								<Button className='w-full justify-between' role='combobox' variant='outline'>
									{awardTypes?.length ? 'Поиск и выбор типов наград...' : 'Список типов наград пуст'}
									<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
								</Button>
							</PopoverTrigger>
							<PopoverContent align='start' className='w-[--radix-popover-trigger-width] p-0'>
								<Command>
									<CommandInput placeholder='Поиск типа награды...' />
									<CommandList>
										<CommandEmpty>Тип награды не найден.</CommandEmpty>
										<CommandGroup>
											{awardTypes?.map((awardType) => (
												<CommandItem
													key={awardType.id}
													value={awardType.name}
													onSelect={() => toggleAwardType(awardType.id)}
												>
													<Check
														className={cn(
															'mr-2 h-4 w-4',
															awardTypeIds.includes(awardType.id) ? 'opacity-100' : 'opacity-0',
														)}
													/>
													{awardType.name}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>

						{selectedAwardTypes.length ? (
							<div className='flex flex-wrap gap-2'>
								{selectedAwardTypes.map((awardType) => (
									<Badge key={awardType.id} className='gap-1 py-1 pr-1.5 pl-2' variant='secondary'>
										<span>{awardType.name}</span>
										<button
											aria-label={`Удалить ${awardType.name}`}
											className='rounded-sm p-0.5 hover:bg-black/10'
											type='button'
											onClick={() => toggleAwardType(awardType.id)}
										>
											<X className='h-3.5 w-3.5' />
										</button>
									</Badge>
								))}
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>Выбранные типы будут показаны здесь</p>
						)}
					</div>

					<Separator />

					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<h3 className='font-semibold'>Поля категории</h3>
							<Button size='sm' type='button' variant='outline' onClick={addField}>
								<Plus className='mr-2 h-4 w-4' />
								Добавить поле
							</Button>
						</div>

						{fields.length ? (
							<div className='space-y-4'>
								{fields.map((field, index) => (
									<Card key={`field-${index}`}>
										<CardHeader className='pb-3'>
											<CardTitle className='text-base'>Поле #{index + 1}</CardTitle>
										</CardHeader>
										<CardContent className='space-y-4'>
											<div className='grid gap-4 md:grid-cols-2'>
												<div className='space-y-2'>
													<Label htmlFor={`field-key-${index}`}>Key *</Label>
													<Input
														id={`field-key-${index}`}
														placeholder='publicationUrl'
														value={field.key}
														onChange={(event) => updateField(index, { key: event.target.value })}
													/>
												</div>

												<div className='space-y-2'>
													<Label htmlFor={`field-label-${index}`}>Label *</Label>
													<Input
														id={`field-label-${index}`}
														placeholder='Ссылка на публикацию'
														value={field.label}
														onChange={(event) => updateField(index, { label: event.target.value })}
													/>
												</div>
											</div>

											<div className='grid gap-4 md:grid-cols-2'>
												<div className='space-y-2'>
													<Label htmlFor={`field-type-${index}`}>Тип</Label>
													<Select
														value={field.type}
														onValueChange={(value: CategoryFieldType) =>
															updateField(index, { type: value })
														}
													>
														<SelectTrigger id={`field-type-${index}`}>
															<SelectValue placeholder='Выберите тип поля' />
														</SelectTrigger>
														<SelectContent>
															{FIELD_TYPE_OPTIONS.map((type) => (
																<SelectItem key={type} value={type}>
																	{type}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className='space-y-2'>
													<Label htmlFor={`field-placeholder-${index}`}>Placeholder</Label>
													<Input
														id={`field-placeholder-${index}`}
														placeholder='https://...'
														value={field.placeholder || ''}
														onChange={(event) => updateField(index, { placeholder: event.target.value })}
													/>
												</div>
											</div>

											<div className='space-y-2'>
												<Label htmlFor={`field-help-${index}`}>Help text</Label>
												<Input
													id={`field-help-${index}`}
													placeholder='Подсказка для пользователя'
													value={field.helpText || ''}
													onChange={(event) => updateField(index, { helpText: event.target.value })}
												/>
											</div>

											<div className='flex items-center justify-between rounded-md border p-3'>
												<div>
													<p className='text-sm font-medium'>Обязательное поле</p>
													<p className='text-xs text-muted-foreground'>
														Пользователь не сможет отправить форму без значения
													</p>
												</div>
												<Checkbox
													checked={field.required}
													onCheckedChange={(checked) => updateField(index, { required: checked === true })}
												/>
											</div>

											<div className='flex justify-end'>
												<Button
													size='sm'
													type='button'
													variant='destructive'
													onClick={() => removeField(index)}
												>
													<Trash2 className='mr-2 h-4 w-4' />
													Удалить поле
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
								Поля пока не добавлены. Нажмите «Добавить поле», чтобы настроить форму категории.
							</div>
						)}
					</div>
				</CardContent>

				<CardFooter className='flex justify-between'>
					<Button variant='destructive' onClick={() => setIsDeleteDialogOpen(true)}>
						<Trash2 className='mr-2 h-4 w-4' />
						Удалить
					</Button>

					<div className='flex gap-2'>
						<Button variant='outline' onClick={() => replace(`/kpi/categories/${category.id}`)}>
							Отменить
						</Button>
						<Button disabled={updateMutation.isPending} onClick={handleSubmit}>
							<Save className='mr-2 h-4 w-4' />
							Сохранить
						</Button>
					</div>
				</CardFooter>
			</Card>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
						<AlertDialogDescription>
							Это действие нельзя отменить. Категория будет удалена без возможности восстановления.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Отменить</AlertDialogCancel>
						<AlertDialogAction variant='destructive' onClick={handleDelete}>
							Удалить
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}

export default Page
