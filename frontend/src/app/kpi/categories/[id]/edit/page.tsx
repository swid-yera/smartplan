'use client'

import { useEffect, useMemo, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { Forbidden, Loader, LocaleToggleButton, PageTitle, withNavAccess } from '@components'
import {
	CATEGORY_ICON_OPTIONS,
	createLocaleText,
	getLocaleText,
	getUILocaleSection,
	hasRole,
	interpolateUILocaleText,
} from '@helpers'
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
	Button,
	ButtonGroup,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Label,
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
import type { IApiErrorResponse, ICategoryRequest, Locale } from '@types'
import { RoleEnum } from '@types'
import { isAxiosError } from 'axios'
import { Minus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
	AwardTypesSelector,
	CategoryFieldsEditor,
	type ICategoryFieldFormState,
	isValidMultiFieldDefinition,
	mapCategoryToFormFields,
	normalizeSortOrder,
	sanitizeFieldOptions,
	sanitizeFieldValidation,
	toLocaleDraft,
} from '../../components'
import localeDictionary from './locale.json'

const Page = () => {
	const { id } = useParams<{ id: string }>()
	const { push, replace } = useRouter()
	const { user, authLoading } = useAuthStore()
	const [activeLocale, setActiveLocale] = useState<Locale>('ru')
	const t = getUILocaleSection(localeDictionary, activeLocale)

	const [name, setName] = useState<Record<Locale, string>>({ ru: '', kk: '' })
	const [iconName, setIconName] = useState('')
	const [description, setDescription] = useState<Record<Locale, string>>({ ru: '', kk: '' })
	const [awardTypeIds, setAwardTypeIds] = useState<string[]>([])
	const [fields, setFields] = useState<ICategoryFieldFormState[]>([])
	const [isInitialized, setIsInitialized] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const backHref = `/kpi/categories/${id}`
	const deleteBackHref = '/kpi/categories'

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

		setName(toLocaleDraft(category.name))
		setIconName(category.icon || '')
		setDescription(toLocaleDraft(category.description))
		setAwardTypeIds(category.awardTypes || [])
		setFields(mapCategoryToFormFields(category))
		setIsInitialized(true)
	}, [category, isInitialized])

	const categoryPayload = useMemo<ICategoryRequest>(
		() => ({
			name: createLocaleText(name.ru.trim(), name.kk.trim()),
			icon: iconName || undefined,
			description:
				description.ru.trim() || description.kk.trim()
					? createLocaleText(description.ru.trim(), description.kk.trim())
					: undefined,
			awardTypes: awardTypeIds,
			fields: fields.map((field, index) => ({
				...field,
				key: field.key.trim(),
				required: field.type === 'url' || field.type === 'file' ? false : field.required,
				options: sanitizeFieldOptions(field.type, field.options),
				validation: sanitizeFieldValidation(field.type, field.validation),
				label: createLocaleText(field.label.ru.trim(), field.label.kk.trim()),
				placeholder:
					field.placeholder.ru.trim() || field.placeholder.kk.trim()
						? createLocaleText(field.placeholder.ru.trim(), field.placeholder.kk.trim())
						: null,
				helpText:
					field.helpText.ru.trim() || field.helpText.kk.trim()
						? createLocaleText(field.helpText.ru.trim(), field.helpText.kk.trim())
						: null,
				sortOrder: normalizeSortOrder(field.sortOrder, index + 1),
			})),
		}),
		[awardTypeIds, description, fields, iconName, name],
	)

	const handleSubmit = () => {
		if (!category) return

		if (!name.ru.trim() && !name.kk.trim()) {
			toast.error(t.validationRequiredName)

			return
		}

		const invalidField = fields.find(
			(field) => !field.key.trim() || (!field.label.ru.trim() && !field.label.kk.trim()),
		)

		if (invalidField) {
			toast.error(t.validationFieldKeyLabel)

			return
		}

		const invalidSelectField = fields.find(
			(field) => field.type === 'select' && sanitizeFieldOptions(field.type, field.options).length === 0,
		)

		if (invalidSelectField) {
			toast.error(interpolateUILocaleText(t.validationSelectOption, { key: invalidSelectField.key || 'select' }))

			return
		}

		const invalidMultiField = fields.find(
			(field) => field.type === 'multi_fields' && !isValidMultiFieldDefinition(field),
		)

		if (invalidMultiField) {
			const invalidMultiFieldLabel =
				invalidMultiField.label[activeLocale]?.trim() ||
				invalidMultiField.label.ru.trim() ||
				invalidMultiField.label.kk.trim()

			toast.error(`Настройте подполя для «${invalidMultiFieldLabel || invalidMultiField.key}»`)

			return
		}

		const toastId = `update-category-${category.id}`

		toast.loading(
			interpolateUILocaleText(t.toastSaving, {
				name: name[activeLocale].trim() || name.ru.trim() || name.kk.trim(),
			}),
			{
				id: toastId,
			},
		)

		updateMutation.mutate(
			{ id: category.id, changedCategory: categoryPayload },
			{
				onSuccess: (updatedCategory) => {
					const categoryName = getLocaleText(updatedCategory.name, activeLocale)

					toast.success(interpolateUILocaleText(t.toastSaved, { name: categoryName }), { id: toastId })
					replace(`/kpi/categories/${updatedCategory.id}`)
				},
				onError: (error) => {
					let errorMessage = t.toastUpdateError

					if (isAxiosError<IApiErrorResponse>(error)) {
						errorMessage = error.response?.data?.error || error.message || errorMessage
					} else if (error instanceof Error) {
						errorMessage = error.message
					}

					toast.error(t.toastUpdateError, {
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
		const categoryName = getLocaleText(category.name, activeLocale)

		toast.loading(interpolateUILocaleText(t.toastDeleteLoading, { name: categoryName }), { id: toastId })

		deleteMutation.mutate(category.id, {
			onSuccess: () => {
				toast.success(interpolateUILocaleText(t.toastDeleted, { name: categoryName }), { id: toastId })
				push(deleteBackHref)
			},
			onError: (error) => {
				let errorMessage = t.toastDeleteError

				if (isAxiosError<IApiErrorResponse>(error)) {
					errorMessage = error.response?.data?.error || error.message || errorMessage
				} else if (error instanceof Error) {
					errorMessage = error.message
				}

				toast.error(t.toastDeleteError, {
					id: toastId,
					description: errorMessage,
				})
			},
		})
	}

	if (isPageLoading) return <Loader type='data' />
	if (!user || !isAdmin) return <Forbidden />
	if (!category) return <p className='p-6 text-center text-muted-foreground'>{t.notFound}</p>

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle
				sticky
				actions={
					<ButtonGroup className='sm:w-auto'>
						<Button
							className='hover:text-primary'
							disabled={updateMutation.isPending}
							variant='outline'
							onClick={handleSubmit}
						>
							<Save className='mr-2 h-4 w-4' />
							{t.save}
						</Button>

						<Button
							className='hover:text-destructive'
							type='button'
							variant='outline'
							onClick={() => setIsDeleteDialogOpen(true)}
						>
							<Trash2 className='mr-2 h-4 w-4' />
							{t.delete}
						</Button>

						<LocaleToggleButton
							activeLocale={activeLocale}
							labels={{ kk: t.langKk, ru: t.langRu }}
							onChangeLocale={setActiveLocale}
						/>
					</ButtonGroup>
				}
				backHref={backHref}
				description={t.pageDescription}
			>
				{t.pageTitle}
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>
						{interpolateUILocaleText(t.cardTitle, { name: name[activeLocale] || name.ru || name.kk })}
					</CardTitle>
					<CardDescription>{t.cardDescription}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* icon & title */}
					<div className='flex flex-col gap-4 md:flex-row'>
						<div className='space-y-2 w-full md:w-auto'>
							<Label htmlFor='icon'>{t.labelIcon}</Label>
							<Select
								value={iconName || 'none'}
								onValueChange={(value) => setIconName(value === 'none' ? '' : value)}
							>
								<SelectTrigger className='w-full' id='icon'>
									<SelectValue placeholder={t.placeholderIcon} />
								</SelectTrigger>
								<SelectContent className='w-55'>
									<div className='grid grid-cols-4 gap-1 p-1'>
										<SelectItem
											className='h-10 w-10 justify-center p-0 pr-0'
											textValue={t.noneIcon}
											value='none'
										>
											<Minus aria-hidden='true' className='h-4 w-4' />
											<span className='sr-only'>{t.noneIcon}</span>
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

						<div className='space-y-2 w-full'>
							<Label htmlFor='name'>{t.labelName}</Label>
							<Input
								id='name'
								placeholder={t.placeholderName}
								value={name[activeLocale]}
								onChange={(event) =>
									setName((prev) => ({
										...prev,
										[activeLocale]: event.target.value,
									}))
								}
							/>
						</div>
					</div>

					{/* desc */}
					<div className='space-y-2'>
						<Label htmlFor='description'>{t.labelDescription}</Label>
						<Textarea
							className='min-h-50 md:min-h-30'
							id='description'
							placeholder={t.placeholderDescription}
							value={description[activeLocale]}
							onChange={(event) =>
								setDescription((prev) => ({
									...prev,
									[activeLocale]: event.target.value,
								}))
							}
						/>
					</div>

					<Separator />

					<AwardTypesSelector
						activeLocale={activeLocale}
						awardTypes={awardTypes}
						labels={t.awardTypesSelector}
						value={awardTypeIds}
						onChange={setAwardTypeIds}
					/>

					<Separator />

					<CategoryFieldsEditor activeLocale={activeLocale} fields={fields} onChange={setFields} />
				</CardContent>

				<CardFooter className='flex justify-between'>
					<Button variant='destructive' onClick={() => setIsDeleteDialogOpen(true)}>
						<Trash2 className='mr-2 h-4 w-4' />
						{t.delete}
					</Button>

					<div className='flex gap-2'>
						<Button variant='outline' onClick={() => replace(backHref)}>
							{t.cancel}
						</Button>
						<Button disabled={updateMutation.isPending} onClick={handleSubmit}>
							<Save className='mr-2 h-4 w-4' />
							{t.save}
						</Button>
					</div>
				</CardFooter>
			</Card>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t.deleteDialogTitle}</AlertDialogTitle>
						<AlertDialogDescription>{t.deleteDialogDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t.cancel}</AlertDialogCancel>
						<AlertDialogAction variant='destructive' onClick={handleDelete}>
							{t.delete}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	)
}

export default withNavAccess(Page)
