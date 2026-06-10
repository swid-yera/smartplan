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
	findInvalidUrlCategoryField,
	isFileFieldValueArray,
	serializeCategoryFieldValue,
	withPermission,
} from '@components'
import { getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import type {
	IApiErrorResponse,
	ICategoryTypeResponse,
	ICreateAwardRequest,
	ICriteriaResponse,
	ITypeResponse,
	IVariantResponse,
} from '@types'
import { CriteriaMethodEnum, PermissionCodeEnum } from '@types'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { AwardTypeSelectionFields } from '../../components'
import localeDictionary from './locale.json'

const normalizeCategoryType = (type: ICategoryTypeResponse): ITypeResponse => ({
	id: type.id,
	name: type.name,
	variants: type.variants.map((variant) => ({
		id: variant.id,
		name: variant.name,
		description: variant.description ?? null,
		criteria: variant.criteria.map((criteria) => ({
			id: criteria.id,
			name: criteria.name,
			points: criteria.points,
			method: criteria.method as CriteriaMethodEnum,
		})),
		bonus_criteria: (variant.bonus_criteria ?? variant.bonusCriteria ?? null)?.map((criteria) => ({
			id: criteria.id,
			name: criteria.name,
			points: criteria.points,
			method: criteria.method as CriteriaMethodEnum,
		})),
	})),
})

const Page = () => {
	const { id } = useParams<{ id: string }>()
	const { push } = useRouter()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const [selectedType, setSelectedType] = useState<ITypeResponse | null>(null)
	const [selectedVariant, setSelectedVariant] = useState<IVariantResponse | null>(null)
	const [selectedCriteria, setSelectedCriteria] = useState<ICriteriaResponse | null>(null)
	const [selectedBonusCriteria, setSelectedBonusCriteria] = useState<ICriteriaResponse | null>(null)
	const [categoryFieldValues, setCategoryFieldValues] = useState<ICategoryFieldValues>({})
	const [isInitialized, setIsInitialized] = useState(false)

	const { data: types = [], isLoading: isTypesLoading } = useQuery({
		...services.award.getAllTypesOptions(),
	})

	const { data: award, isLoading: isAwardLoading } = useQuery({
		...services.award.getByIdOptions(id),
		enabled: !!id,
	})

	const categoryId = award?.categoryId

	const { data: category, isLoading: isCategoryLoading } = useQuery({
		...services.categories.getByIdOptions(categoryId || ''),
		enabled: !!categoryId,
	})

	const availableTypes = useMemo(() => {
		if (category?.awardTypesExpanded?.length) {
			return category.awardTypesExpanded.map(normalizeCategoryType)
		}

		if (!category?.awardTypes?.length) return types

		const allowedTypeIds = new Set(category.awardTypes)

		return types.filter((type) => allowedTypeIds.has(type.id))
	}, [category?.awardTypes, category?.awardTypesExpanded, types])

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

	const existingFileValues = useMemo(() => {
		if (!category?.fieldsExpanded?.length || !award?.fieldValues) return {}

		return category.fieldsExpanded.reduce<Record<string, string[]>>((acc, field) => {
			if (field.type !== 'file') return acc

			const rawValue = award.fieldValues?.[field.key]
			const values = Array.isArray(rawValue) ? rawValue : [rawValue]
			const normalizedValues = values.filter(
				(value): value is string => typeof value === 'string' && value.trim().length > 0,
			)

			if (normalizedValues.length > 0) {
				acc[field.key] = normalizedValues
			}

			return acc
		}, {})
	}, [award?.fieldValues, category?.fieldsExpanded])

	useEffect(() => {
		setIsInitialized(false)
	}, [award?.id])

	useEffect(() => {
		if (!award || !availableTypes.length || !category?.fieldsExpanded?.length || isInitialized) return

		const type = availableTypes.find((item) => item.id === award.type.id) || award.type || null
		const variant = type?.variants.find((item) => item.id === award.variant.id) || award.variant || null
		const variantCriteria = variant?.criteria ?? []
		const criteria = variantCriteria.find((item) => item.id === award.criteria.id) || award.criteria || null
		const normalizedBonusCriteria = award.bonus_criteria || null
		const bonusCriteria =
			normalizedBonusCriteria &&
			((variant?.bonus_criteria ?? []).find((item) => item.id === normalizedBonusCriteria.id) ||
				normalizedBonusCriteria)

		const initialValues = buildInitialCategoryFieldValues(category.fieldsExpanded)

		const mappedValues = category.fieldsExpanded.reduce<ICategoryFieldValues>((acc, field) => {
			const rawValue = award.fieldValues?.[field.key]

			if (field.type === 'multi_fields') {
				const subFields = Array.isArray(field.options)
					? field.options.filter(
							(option): option is { key: string; type: string } =>
								typeof option === 'object' && option !== null && 'key' in option && 'type' in option,
						)
					: []

				acc[field.key] = Array.isArray(rawValue)
					? rawValue
							.map((row) => {
								if (!row || typeof row !== 'object' || Array.isArray(row)) return null

								const normalizedRow: Record<string, string> = {}

								for (const subField of subFields) {
									const rowValue = row[subField.key]

									if (typeof rowValue === 'number' && Number.isFinite(rowValue)) {
										normalizedRow[subField.key] = String(rowValue)
										continue
									}

									normalizedRow[subField.key] = typeof rowValue === 'string' ? rowValue : ''
								}

								return normalizedRow
							})
							.filter((row): row is Record<string, string> => !!row)
					: []

				return acc
			}

			if (field.type === 'file') {
				acc[field.key] = []

				return acc
			}

			if (Array.isArray(rawValue)) {
				const firstValue = rawValue.find((item) => typeof item === 'string')

				acc[field.key] = typeof firstValue === 'string' ? firstValue : ''

				return acc
			}

			if (field.type === 'number' && typeof rawValue === 'number' && Number.isFinite(rawValue)) {
				acc[field.key] = String(rawValue)

				return acc
			}

			acc[field.key] = typeof rawValue === 'string' ? rawValue : ''

			return acc
		}, initialValues)

		setSelectedType(type)
		setSelectedVariant(variant)
		setSelectedCriteria(criteria)
		setSelectedBonusCriteria(bonusCriteria || null)
		setCategoryFieldValues(mappedValues)
		setIsInitialized(true)
	}, [award, availableTypes, category?.fieldsExpanded, isInitialized])

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

	const { mutate: mutateUpdate, isPending } = useMutation({
		...services.award.updateOptions(),
	})

	const handleSubmit = () => {
		if (!award || !category || !selectedType || !selectedVariant || !selectedCriteria) {
			toast.error(t.requiredFields)

			return
		}

		const missingRequiredField = category.fieldsExpanded.find((field) => {
			if (!field.required) return false

			const value = categoryFieldValues[field.key]

			if (field.type === 'file') {
				const hasNewFile = Array.isArray(value) && value.length > 0
				const existingFile = existingFileValues[field.key]

				return !hasNewFile && (!Array.isArray(existingFile) || existingFile.length === 0)
			}

			if (Array.isArray(value)) return value.length === 0

			return !String(value || '').trim()
		})

		if (missingRequiredField) {
			toast.error(
				interpolateUILocaleText(t.requiredField, { field: getLocaleText(missingRequiredField.label, locale) }),
			)

			return
		}

		const invalidUrlField = findInvalidUrlCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (invalidUrlField) {
			toast.error(interpolateUILocaleText(t.invalidDomain, { field: getLocaleText(invalidUrlField.label, locale) }))

			return
		}

		const futureDateField = findFutureDateCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (futureDateField) {
			toast.error(interpolateUILocaleText(t.futureDate, { field: getLocaleText(futureDateField.label, locale) }))

			return
		}

		const fieldValues = category.fieldsExpanded.reduce<
			Record<string, string | string[] | number | Array<Record<string, string | number>>>
		>((acc, field) => {
			const value = categoryFieldValues[field.key]

			if (field.type === 'file') {
				if (Array.isArray(value) && value[0]) {
					acc[field.key] = ['']

					return acc
				}

				const existingFiles = existingFileValues[field.key] || []

				acc[field.key] = existingFiles.length > 0 ? existingFiles : ''

				return acc
			}

			const serializedValue = serializeCategoryFieldValue(field, value)

			if (serializedValue !== undefined) {
				acc[field.key] = serializedValue
			}

			return acc
		}, {})

		const filesByField = category.fieldsExpanded.reduce<Record<string, File[]>>((acc, field) => {
			if (field.type !== 'file') return acc

			const value = categoryFieldValues[field.key]

			if (!isFileFieldValueArray(value) || value.length === 0) return acc

			acc[field.key] = value

			return acc
		}, {})

		const changedAward: ICreateAwardRequest = {
			type: selectedType.id,
			variant: selectedVariant.id,
			criteria: selectedCriteria.id,
			bonusCriteria: selectedBonusCriteria?.id,
			categoryId: category.id,
			text: typeof categoryFieldValues.text === 'string' ? categoryFieldValues.text : award.text || '',
			fieldValues,
		}

		const toastId = `award-${id}-update`

		toast.loading(t.saving, { id: toastId })

		mutateUpdate(
			{ changedAward, id: award.id, filesByField },
			{
				onSuccess: () => {
					toast.success(t.saved, { id: toastId })
					push(`/kpi/${id}`)
				},
				onError: (error) => {
					let errorMessage = t.updateError

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

					toast.error(t.updateError, { description: errorMessage, id: toastId })
				},
			},
		)
	}

	const handleCategoryFieldChange = (fieldKey: string, nextValue: ICategoryFieldValue) => {
		setCategoryFieldValues((prev) => ({ ...prev, [fieldKey]: nextValue }))
	}

	if (isAwardLoading || isCategoryLoading || isTypesLoading) {
		return <Loader type='data' />
	}

	if (!award) {
		return <p className='p-6 text-center text-muted-foreground'>{t.awardNotFound}</p>
	}

	if (!category) {
		return <p className='p-6 text-center text-muted-foreground'>{t.categoryNotFound}</p>
	}

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle backHref={`/kpi/${id}`} description={t.pageDescription}>
				{t.pageTitle}
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>{t.cardTitle}</CardTitle>
					<CardDescription>{t.cardDescription}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-5'>
					<CategoryFieldsSection
						emptyText={t.emptyTopFields}
						fields={topCategoryFields}
						title={t.topFieldsTitle}
						values={categoryFieldValues}
						onChange={handleCategoryFieldChange}
					/>

					<Separator />

					<AwardTypeSelectionFields
						availableTypes={availableTypes}
						labels={t.awardTypeSelection}
						layout='grid'
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
							<Separator />

							<CategoryFieldsSection
								columns={1}
								fields={bottomCategoryFields}
								title={t.bottomTitle}
								values={categoryFieldValues}
								onChange={handleCategoryFieldChange}
							/>

							{Object.keys(existingFileValues).length > 0 && (
								<div className='rounded-md border border-dashed p-3 space-y-2'>
									<h4 className='text-sm font-semibold'>{t.uploadedFiles}</h4>
									<ul className='space-y-1 text-sm'>
										{Object.entries(existingFileValues).map(([fieldKey, fileUrl]) => {
											const hasNewFile =
												Array.isArray(categoryFieldValues[fieldKey]) &&
												(categoryFieldValues[fieldKey] as File[]).length > 0

											if (hasNewFile) return null

											return (
												<li key={fieldKey} className='space-y-1'>
													<span className='text-muted-foreground mr-2'>{fieldKey}:</span>
													<ul className='space-y-1'>
														{fileUrl.map((url, index) => (
															<li key={`${fieldKey}-${index}`}>
																<a
																	className='text-primary hover:underline break-all'
																	href={url}
																	rel='noopener noreferrer'
																	target='_blank'
																>
																	{t.openCurrentFile} {index + 1}
																</a>
															</li>
														))}
													</ul>
												</li>
											)
										})}
									</ul>
								</div>
							)}
						</>
					)}
				</CardContent>

				<CardFooter className='justify-end'>
					<Button disabled={isPending} onClick={handleSubmit}>
						{t.save}
					</Button>
				</CardFooter>
			</Card>
		</section>
	)
}

export default withPermission(Page, [PermissionCodeEnum.KPI_FULL, PermissionCodeEnum.KPI_VIEW])
