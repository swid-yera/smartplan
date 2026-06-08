'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { PageTitle, withRole } from '@components'
import {
	CATEGORY_ICON_OPTIONS,
	createLocaleText,
	getLocaleText,
	getUILocaleSection,
	interpolateUILocaleText,
} from '@helpers'
import { services } from '@services'
import {
	Button,
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
	Tabs,
	TabsList,
	TabsTrigger,
	Textarea,
} from '@shadcn'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { IApiErrorResponse, ICategoryRequest, Locale } from '@types'
import { RoleEnum } from '@types'
import { isAxiosError } from 'axios'
import { Minus } from 'lucide-react'
import { toast } from 'sonner'

import {
	AwardTypesSelector,
	CategoryFieldsEditor,
	type ICategoryFieldFormState,
	isValidMultiFieldDefinition,
	normalizeSortOrder,
	sanitizeFieldOptions,
	sanitizeFieldValidation,
} from '../components'
import localeDictionary from './locale.json'

const Page = () => {
	const { replace } = useRouter()
	const [activeLocale, setActiveLocale] = useState<Locale>('ru')
	const t = getUILocaleSection(localeDictionary, activeLocale)

	const [name, setName] = useState<Record<Locale, string>>({ ru: '', kk: '' })
	const [iconName, setIconName] = useState('')
	const [description, setDescription] = useState<Record<Locale, string>>({ ru: '', kk: '' })
	const [awardTypeIds, setAwardTypeIds] = useState<string[]>([])
	const [fields, setFields] = useState<ICategoryFieldFormState[]>([])

	const { data: awardTypes } = useQuery({
		...services.award.getAllTypesOptions(),
		enabled: true,
	})

	const { mutate, isPending } = useMutation({
		...services.categories.createOptions(),
	})
	const handleSubmit = () => {
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

		const payload: ICategoryRequest = {
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
		}

		const categoryName = name[activeLocale].trim() || name.ru.trim() || name.kk.trim()
		const toastId = `create-category-${categoryName}`

		toast.loading(interpolateUILocaleText(t.toastCreating, { name: categoryName }), { id: toastId })

		mutate(
			{ newCategory: payload },
			{
				onSuccess: (createdCategory) => {
					const categoryName = getLocaleText(createdCategory.name, activeLocale)

					toast.success(interpolateUILocaleText(t.toastCreated, { name: categoryName }), { id: toastId })
					replace('/kpi/categories')
				},
				onError: (error) => {
					let errorMessage = t.toastError

					if (isAxiosError<IApiErrorResponse>(error)) {
						errorMessage = error.response?.data?.error || error.message || errorMessage
					} else if (error instanceof Error) {
						errorMessage = error.message
					}

					toast.error(t.toastError, {
						id: toastId,
						description: errorMessage,
					})
				},
			},
		)
	}

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle
				sticky
				actions={
					<Tabs value={activeLocale} onValueChange={(value) => setActiveLocale(value as Locale)}>
						<TabsList>
							<TabsTrigger value='ru'>{t.langRu}</TabsTrigger>
							<TabsTrigger value='kk'>{t.langKk}</TabsTrigger>
						</TabsList>
					</Tabs>
				}
				backHref='/kpi/categories'
				description={t.pageDescription}
			>
				{t.pageTitle}
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>{t.newCategory}</CardTitle>
					<CardDescription>{t.cardDescription}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='space-y-2'>
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

						<div className='space-y-2'>
							<Label htmlFor='icon'>{t.labelIcon}</Label>
							<Select
								value={iconName || 'none'}
								onValueChange={(value) => setIconName(value === 'none' ? '' : value)}
							>
								<SelectTrigger id='icon'>
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
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>{t.labelDescription}</Label>
						<Textarea
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
						value={awardTypeIds}
						onChange={setAwardTypeIds}
					/>

					<Separator />

					<CategoryFieldsEditor activeLocale={activeLocale} fields={fields} onChange={setFields} />
				</CardContent>

				<CardFooter className='flex justify-end'>
					<Button disabled={isPending} onClick={handleSubmit}>
						{t.create}
					</Button>
				</CardFooter>
			</Card>
		</section>
	)
}

export default withRole(Page, [RoleEnum.ADMIN])
