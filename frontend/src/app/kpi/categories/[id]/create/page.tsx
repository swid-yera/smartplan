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
	findInvalidCategoryFieldByValidation,
	findMissingRequiredCategoryField,
	getCategoryFieldValidationError,
	isFileFieldValueArray,
	serializeCategoryFieldValue,
	withPermission,
} from '@components'
import { getCategoryIconOptionByName, getLocaleText, getUILocaleSection } from '@helpers'
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
	Separator,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
	type IApiErrorResponse,
	type ICreateAwardRequest,
	type ICriteriaResponse,
	type ITypeResponse,
	type IVariantResponse,
	PermissionCodeEnum,
} from '@types'
import { isAxiosError } from 'axios'
import { Folder } from 'lucide-react'
import { toast } from 'sonner'

import { AwardTypeSelectionFields } from '../../../components'
import localeDictionary from './locale.json'

const DOMAIN_ONLY_REGEX = /^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/

const removeHttpProtocol = (value: string) => value.replace(/^https?:\/\//i, '')

const extractDomain = (value: string) => {
	const normalizedValue = removeHttpProtocol(value.trim())

	return normalizedValue.split(/[/?#]/)[0]
}

function CreateAwardPage() {
	const params = useParams<{ id: string }>()
	const categoryId = params.id
	const { push } = useRouter()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

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

		const invalidFieldByValidation = findInvalidCategoryFieldByValidation(
			category.fieldsExpanded,
			categoryFieldValues,
		)

		if (invalidFieldByValidation) {
			const validationErrorMessage = getCategoryFieldValidationError(
				invalidFieldByValidation,
				categoryFieldValues[invalidFieldByValidation.key],
			)

			toast.error(
				validationErrorMessage
					? `Поле «${getLocaleText(invalidFieldByValidation.label, locale)}»: ${validationErrorMessage}`
					: `Поле «${getLocaleText(invalidFieldByValidation.label, locale)}» заполнено некорректно`,
			)

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
			fieldValues: category.fieldsExpanded.reduce<
				Record<string, string | string[] | number | Array<Record<string, string | number>>>
			>((acc, field) => {
				const value = categoryFieldValues[field.key]

				if (field.type === 'file') {
					const hasFile = isFileFieldValueArray(value) && value.length > 0

					acc[field.key] = hasFile ? [''] : ''

					return acc
				}

				const serializedValue = serializeCategoryFieldValue(field, value)

				if (serializedValue !== undefined) {
					acc[field.key] = serializedValue
				}

				return acc
			}, {}),
		}
		const filesByField = category.fieldsExpanded.reduce<Record<string, File[]>>((acc, field) => {
			if (field.type !== 'file') return acc

			const value = categoryFieldValues[field.key]

			if (!isFileFieldValueArray(value) || value.length === 0) return acc

			acc[field.key] = value

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
					push(`/kpi/${createdAward.id}?sendToReview=1`)
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
		<section className='mx-auto max-w-7xl w-full p-6 space-y-6'>
			<PageTitle backHref='back' description={t.pageDescription}>
				{t.pageTitle}
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
					<CardTitle>{t.formTitle}</CardTitle>
					<CardDescription>{t.formDescription}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-5'>
					<CategoryFieldsSection
						emptyText={t.emptyTopFields}
						fields={topCategoryFieldsWithEffectiveRequired}
						title={t.topFieldsTitle}
						values={categoryFieldValues}
						onChange={handleCategoryFieldChange}
					/>

					<Separator className='my-8' />

					<AwardTypeSelectionFields
						showHints
						showVariantDescription
						availableTypes={availableTypes}
						labels={t.awardTypeSelection}
						layout='stack'
						locale={locale}
						selectedBonusCriteria={selectedBonusCriteria}
						selectedCriteria={selectedCriteria}
						selectedType={selectedType}
						selectedVariant={selectedVariant}
						setSelectedBonusCriteria={setSelectedBonusCriteria}
						setSelectedCriteria={setSelectedCriteria}
						setSelectedType={setSelectedType}
						setSelectedVariant={setSelectedVariant}
						typeLabel={t.typeLabel}
					/>

					{bottomCategoryFields.length > 0 && (
						<>
							<Separator className='my-8' />

							<CategoryFieldsSection
								columns={1}
								fields={bottomCategoryFieldsWithEffectiveRequired}
								title={t.bottomFieldsTitle}
								values={categoryFieldValues}
								onChange={handleCategoryFieldChange}
							/>
						</>
					)}
				</CardContent>

				<CardFooter className='flex justify-end'>
					<Button disabled={isPending || !availableTypes.length} variant='default' onClick={handleSubmit}>
						{t.createAward}
					</Button>
				</CardFooter>
			</Card>
		</section>
	)
}

export default withPermission(CreateAwardPage, [PermissionCodeEnum.KPI_FULL, PermissionCodeEnum.KPI_VIEW])
