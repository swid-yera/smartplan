'use client'

import { useEffect, useMemo, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import {
	CategoryFieldsSection,
	type ICategoryFieldValue,
	type ICategoryFieldValues,
	Loader,
	PageTitle,
	buildInitialCategoryFieldValues,
	findFutureDateCategoryField,
	findMissingRequiredCategoryField,
} from '@components'
import { getCategoryIconOptionByName, getLocaleText } from '@helpers'
import { services } from '@services'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { IApiErrorResponse, ICreateAwardRequest, ICriteriaResponse, ITypeResponse, IVariantResponse } from '@types'
import { isAxiosError } from 'axios'
import { Folder } from 'lucide-react'
import { toast } from 'sonner'

const DOMAIN_ONLY_REGEX = /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/

const removeHttpProtocol = (value: string) => value.replace(/^https?:\/\//i, '')

const withHttpsProtocol = (value: string) => {
	const normalizedValue = removeHttpProtocol(value.trim())

	return normalizedValue ? `https://${normalizedValue}` : ''
}

const extractDomain = (value: string) => {
	const normalizedValue = removeHttpProtocol(value.trim())

	return normalizedValue.split(/[/?#]/)[0]
}

export default function CreateAwardPage() {
	const params = useParams<{ id: string }>()
	const categoryId = params.id
	const { push } = useRouter()
	const locale = useLocaleStore((state) => state.locale)

	const [selectedType, setSelectedType] = useState<ITypeResponse | null>(null)
	const [selectedVariant, setSelectedVariant] = useState<IVariantResponse | null>(null)
	const [selectedCriteria, setSelectedCriteria] = useState<ICriteriaResponse | null>(null)
	const [selectedBonusCriteria, setSelectedBonusCriteria] = useState<ICriteriaResponse | null>(null)
	const [categoryFieldValues, setCategoryFieldValues] = useState<ICategoryFieldValues>({})

	const { data: category, isLoading: isCategoryLoading } = useQuery({
		...services.categories.getByIdOptions(categoryId),
		enabled: !!categoryId,
	})

	const { data: types = [], isLoading: isTypesLoading } = useQuery({
		...services.award.getAllTypesOptions(),
		enabled: !!categoryId,
	})

	const availableTypes = useMemo(() => {
		if (!category?.awardTypes?.length) return []
		const allowedTypeIds = new Set(category.awardTypes)

		return types.filter((type) => allowedTypeIds.has(type.id))
	}, [category?.awardTypes, types])

	const topCategoryFields = useMemo(
		() => category?.fieldsExpanded.filter((field) => field.type !== 'url' && field.type !== 'file') ?? [],
		[category?.fieldsExpanded],
	)

	const bottomCategoryFields = useMemo(
		() =>
			(category?.fieldsExpanded.filter((field) => field.type === 'url' || field.type === 'file') ?? []).sort(
				(a, b) => {
					const typeOrder = { url: 0, file: 1 }
					const aOrder = typeOrder[a.type as 'url' | 'file'] ?? 99
					const bOrder = typeOrder[b.type as 'url' | 'file'] ?? 99

					return aOrder - bOrder
				},
			),
		[category?.fieldsExpanded],
	)

	const hasAnyUrlValue = useMemo(
		() =>
			bottomCategoryFields.some((field) => {
				if (field.type !== 'url') return false

				const value = categoryFieldValues[field.key]

				return typeof value === 'string' && value.trim().length > 0
			}),
		[bottomCategoryFields, categoryFieldValues],
	)

	const hasAnyFileValue = useMemo(
		() =>
			bottomCategoryFields.some((field) => {
				if (field.type !== 'file') return false

				const value = categoryFieldValues[field.key]

				return Array.isArray(value) && value.length > 0
			}),
		[bottomCategoryFields, categoryFieldValues],
	)

	const topCategoryFieldsWithEffectiveRequired = useMemo(
		() =>
			topCategoryFields.map((field) => {
				if (field.type === 'url') {
					return {
						...field,
						required: !hasAnyFileValue,
					}
				}

				if (field.type === 'file') {
					return {
						...field,
						required: !hasAnyUrlValue,
					}
				}

				return field
			}),
		[hasAnyFileValue, hasAnyUrlValue, topCategoryFields],
	)

	const bottomCategoryFieldsWithEffectiveRequired = useMemo(
		() =>
			bottomCategoryFields.map((field) => {
				if (field.type === 'url') {
					return {
						...field,
						required: !hasAnyFileValue,
					}
				}

				if (field.type === 'file') {
					return {
						...field,
						required: !hasAnyUrlValue,
					}
				}

				return field
			}),
		[bottomCategoryFields, hasAnyFileValue, hasAnyUrlValue],
	)

	const { mutate: mutateCreate, isPending } = useMutation({
		...services.award.createOptions(),
	})

	useEffect(() => {
		if (!category?.fieldsExpanded?.length) return

		setCategoryFieldValues(buildInitialCategoryFieldValues(category.fieldsExpanded))
	}, [category?.id, category?.fieldsExpanded])

	useEffect(() => {
		if (!selectedType) return

		const isTypeAllowed = availableTypes.some((type) => type.id === selectedType.id)

		if (!isTypeAllowed) {
			setSelectedType(null)
			setSelectedVariant(null)
			setSelectedCriteria(null)
			setSelectedBonusCriteria(null)
		}
	}, [availableTypes, selectedType])

	const handleSubmit = () => {
		if (!category) return

		if (!selectedType || !selectedVariant || !selectedCriteria) {
			toast.error('Выберите тип, вариант и критерий!')

			return
		}

		const fieldsWithEffectiveRequired = category.fieldsExpanded.map((field) => {
			if (field.type === 'url') {
				return {
					...field,
					required: !hasAnyFileValue,
				}
			}

			if (field.type === 'file') {
				return {
					...field,
					required: !hasAnyUrlValue,
				}
			}

			return field
		})

		const missingRequiredField = findMissingRequiredCategoryField(fieldsWithEffectiveRequired, categoryFieldValues)

		if (missingRequiredField) {
			toast.error(`Заполните обязательное поле: ${getLocaleText(missingRequiredField.label, locale)}`)

			return
		}

		const invalidUrlField = category.fieldsExpanded.find((field) => {
			if (field.type !== 'url') return false

			const value = categoryFieldValues[field.key]

			if (typeof value !== 'string') return false

			const trimmedValue = value.trim()

			if (!trimmedValue) return false

			const domain = extractDomain(trimmedValue)

			return !DOMAIN_ONLY_REGEX.test(domain)
		})

		if (invalidUrlField) {
			toast.error(
				`Поле «${getLocaleText(invalidUrlField.label, locale)}» должно содержать только домен (например, example.com)`,
			)

			return
		}

		const futureDateField = findFutureDateCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (futureDateField) {
			toast.error(`Поле «${getLocaleText(futureDateField.label, locale)}» не может быть будущей датой`)

			return
		}

		const newAward: ICreateAwardRequest = {
			text: typeof categoryFieldValues.text === 'string' ? categoryFieldValues.text : '',
			type: selectedType.id,
			variant: selectedVariant.id,
			criteria: selectedCriteria.id,
			bonusCriteria: selectedBonusCriteria?.id,
			categoryId: category.id,
			fieldValues: category.fieldsExpanded.reduce<Record<string, string | string[] | number>>((acc, field) => {
				const value = categoryFieldValues[field.key]

				if (field.type === 'file') {
					const hasFile = Array.isArray(value) && value.length > 0

					acc[field.key] = hasFile ? [''] : ''

					return acc
				}

				if (field.type === 'number') {
					const rawValue = typeof value === 'string' ? value.trim() : ''

					if (!rawValue) {
						acc[field.key] = ''

						return acc
					}

					const parsedValue = Number(rawValue)

					acc[field.key] = Number.isFinite(parsedValue) ? parsedValue : ''

					return acc
				}

				if (field.type === 'url') {
					acc[field.key] = typeof value === 'string' ? withHttpsProtocol(value) : ''

					return acc
				}

				acc[field.key] = typeof value === 'string' ? value : ''

				return acc
			}, {}),
		}
		const filesByField = category.fieldsExpanded.reduce<Record<string, File>>((acc, field) => {
			if (field.type !== 'file') return acc

			const value = categoryFieldValues[field.key]

			if (!Array.isArray(value) || !value[0]) return acc

			acc[field.key] = value[0]

			return acc
		}, {})

		const selectedTypeName = getLocaleText(selectedType.name, locale)
		const categoryName = getLocaleText(category.name, locale)
		const toastId = `award-${selectedType.id}-create`

		toast.loading(`Ввод данных в категории - ${categoryName}`, { id: toastId })

		mutateCreate(
			{ newAward, filesByField },
			{
				onSuccess: (createdAward) => {
					toast.success(`Награда успешно создана с типом - ${getLocaleText(createdAward.type.name, locale)}`, {
						id: toastId,
					})
					push(`/kpi/${createdAward.id}`)
				},
				onError: (error) => {
					let errorMessage = `Ошибка ввода данных - ${selectedTypeName}`

					if (isAxiosError<IApiErrorResponse>(error)) {
						const details = error.response?.data?.details
						const backendError = error.response?.data?.error

						errorMessage =
							(typeof details === 'string' && details.trim()) ||
							(typeof backendError === 'string' && backendError.trim()) ||
							error.message ||
							errorMessage
					} else if (error instanceof Error) {
						errorMessage = error.message
					}

					toast.error('Ошибка при создании награды', {
						id: toastId,
						description: errorMessage,
					})
				},
			},
		)
	}

	const handleCategoryFieldChange = (fieldKey: string, nextValue: ICategoryFieldValue) => {
		setCategoryFieldValues((prev) => ({ ...prev, [fieldKey]: nextValue }))
	}

	if (isCategoryLoading || isTypesLoading) {
		return <Loader type='data' />
	}

	if (!category) {
		return <p className='p-6 text-center text-muted-foreground'>Категория не найдена</p>
	}

	const categoryIconOption = getCategoryIconOptionByName(category.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const categoryName = getLocaleText(category.name, locale)
	const categoryDescription = getLocaleText(category.description, locale) || 'Описание категории отсутствует'

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle
				backHref={`/kpi/categories/${category.id}`}
				description='Ввод данных с ограничениями и полями выбранной категории'
			>
				Ввод данных
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-3'>
						<CategoryIcon className='h-6 w-6 text-primary' />
						<span>{categoryName}</span>
					</CardTitle>
					<CardDescription>{categoryDescription}</CardDescription>
				</CardHeader>
				<CardContent className='space-y-2'>
					<div className='flex flex-wrap gap-2'>
						{availableTypes.length ? (
							availableTypes.map((type) => (
								<Badge key={type.id} variant='secondary'>
									{getLocaleText(type.name, locale)}
								</Badge>
							))
						) : (
							<Badge variant='outline'>Для категории не назначены типы наград</Badge>
						)}
					</div>
					<p className='text-xs text-muted-foreground'>
						Доступно полей категории:{' '}
						<span className='font-medium text-foreground'>{category.fieldsExpanded.length}</span>
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Ввод данных</CardTitle>
					<CardDescription>
						Сначала заполните поля категории, затем выберите тип, вариант и критерий
					</CardDescription>
				</CardHeader>

				<CardContent className='space-y-5'>
					<CategoryFieldsSection
						emptyText='Нет полей кроме URL/FILE'
						fields={topCategoryFieldsWithEffectiveRequired}
						values={categoryFieldValues}
						onChange={handleCategoryFieldChange}
					/>

					<Separator className='my-8' />

					<div className='space-y-2'>
						<Label htmlFor='type'>Тип оценивания</Label>
						<Select
							value={selectedType?.id || ''}
							onValueChange={(id: string) => {
								const type = availableTypes.find((item) => item.id === id) || null

								setSelectedType(type)
								setSelectedVariant(null)
								setSelectedCriteria(null)
								setSelectedBonusCriteria(null)
							}}
						>
							<SelectTrigger className='w-full' id='type'>
								<SelectValue placeholder='Выберите тип' />
							</SelectTrigger>
							<SelectContent>
								{availableTypes.map((type) => (
									<SelectItem key={type.id} value={type.id}>
										{getLocaleText(type.name, locale)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='variant'>Вариант</Label>
						<Select
							disabled={!selectedType || !selectedType.variants.length}
							value={selectedVariant?.id || ''}
							onValueChange={(id: string) => {
								const variant = selectedType?.variants.find((item) => item.id === id) || null

								setSelectedVariant(variant)
								setSelectedCriteria(null)
							}}
						>
							<SelectTrigger className='w-full' id='variant'>
								<SelectValue placeholder='Выберите вариант' />
							</SelectTrigger>
							<SelectContent>
								{(selectedType?.variants || []).map((variant) => (
									<SelectItem key={variant.id} value={variant.id}>
										{getLocaleText(variant.name, locale)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedVariant?.description ? (
							<p className='ml-2 text-xs text-muted-foreground'>
								{getLocaleText(selectedVariant.description, locale)}
							</p>
						) : !selectedType ? (
							<p className='ml-2 text-xs text-muted-foreground'>Сначала выберите тип оценивания</p>
						) : null}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='criteria'>Критерий</Label>
						<Select
							disabled={!selectedVariant || !selectedVariant.criteria.length}
							value={selectedCriteria?.id || ''}
							onValueChange={(id: string) => {
								const criteria = selectedVariant?.criteria.find((item) => item.id === id) || null

								setSelectedCriteria(criteria)
							}}
						>
							<SelectTrigger className='w-full' id='criteria'>
								<SelectValue placeholder='Выберите критерий' />
							</SelectTrigger>
							<SelectContent>
								{(selectedVariant?.criteria || []).map((criteria) => (
									<SelectItem key={criteria.id} value={criteria.id}>
										{getLocaleText(criteria.name, locale)} ({criteria.points.join('-')} баллов)
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{!selectedVariant && <p className='ml-2 text-xs text-muted-foreground'>Сначала выберите вариант</p>}
					</div>

					{selectedVariant && selectedVariant.bonusCriteria && (
						<div className='space-y-2'>
							<Label htmlFor='bonus-criteria'>Бонусный критерий</Label>
							<Select
								value={selectedBonusCriteria?.id || ''}
								onValueChange={(id: string) => {
									const criteria = selectedVariant.bonusCriteria?.find((item) => item.id === id) || null

									setSelectedBonusCriteria(criteria)
								}}
							>
								<SelectTrigger className='w-full' id='bonus-criteria'>
									<SelectValue placeholder='Выберите критерий' />
								</SelectTrigger>
								<SelectContent>
									{selectedVariant.criteria.map((criteria) => (
										<SelectItem key={criteria.id} value={criteria.id}>
											{getLocaleText(criteria.name, locale)} ({criteria.points.join('-')} бонусных баллов)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{bottomCategoryFields.length > 0 && (
						<>
							<Separator className='my-8' />

							<CategoryFieldsSection
								columns={1}
								fields={bottomCategoryFieldsWithEffectiveRequired}
								title='Поля URL и FILE'
								values={categoryFieldValues}
								onChange={handleCategoryFieldChange}
							/>
						</>
					)}
				</CardContent>

				<CardFooter className='flex justify-end'>
					<Button disabled={isPending || !availableTypes.length} variant='default' onClick={handleSubmit}>
						Создать награду
					</Button>
				</CardFooter>
			</Card>
		</section>
	)
}
