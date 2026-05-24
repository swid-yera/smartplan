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
} from '@components'
import { getLocaleText } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { IApiErrorResponse, ICreateAwardRequest, ICriteriaResponse, ITypeResponse, IVariantResponse } from '@types'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { AwardTypeSelectionFields } from '../../components'

const removeHttpProtocol = (value: string) => value.replace(/^https?:\/\//i, '')

const withHttpsProtocol = (value: string) => {
	const normalizedValue = removeHttpProtocol(value.trim())

	return normalizedValue ? `https://${normalizedValue}` : ''
}

const Page = () => {
	const { id } = useParams<{ id: string }>()
	const { push } = useRouter()
	const locale = useLocaleStore((state) => state.locale)

	const [selectedType, setSelectedType] = useState<ITypeResponse | null>(null)
	const [selectedVariant, setSelectedVariant] = useState<IVariantResponse | null>(null)
	const [selectedCriteria, setSelectedCriteria] = useState<ICriteriaResponse | null>(null)
	const [selectedBonusCriteria, setSelectedBonusCriteria] = useState<ICriteriaResponse | null>(null)
	const [categoryFieldValues, setCategoryFieldValues] = useState<ICategoryFieldValues>({})

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
		if (!category?.awardTypes?.length) return types

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

	const existingFileValues = useMemo(() => {
		if (!category?.fieldsExpanded?.length || !award?.fieldValues) return {}

		return category.fieldsExpanded.reduce<Record<string, string>>((acc, field) => {
			if (field.type !== 'file') return acc

			const rawValue = award.fieldValues?.[field.key]
			const value = Array.isArray(rawValue) ? rawValue[0] : rawValue

			if (typeof value === 'string' && value.trim()) {
				acc[field.key] = value
			}

			return acc
		}, {})
	}, [award?.fieldValues, category?.fieldsExpanded])

	useEffect(() => {
		if (!award || !types.length) return

		const type = types.find((item) => item.id === award.type.id) || null
		const variant = type?.variants.find((item) => item.id === award.variant.id) || null
		const criteria = variant?.criteria.find((item) => item.id === award.criteria.id) || null
		const normalizedBonusCriteria = award.bonusCriteria || award.bonus_criteria || null
		const bonusCriteria = normalizedBonusCriteria
			? variant?.bonusCriteria?.find((item) => item.id === normalizedBonusCriteria.id) || null
			: null

		setSelectedType(type)
		setSelectedVariant(variant)
		setSelectedCriteria(criteria)
		setSelectedBonusCriteria(bonusCriteria)
	}, [award, types])

	useEffect(() => {
		if (!award || !category?.fieldsExpanded?.length) return

		const initialValues = buildInitialCategoryFieldValues(category.fieldsExpanded)

		const mappedValues = category.fieldsExpanded.reduce<ICategoryFieldValues>((acc, field) => {
			const rawValue = award.fieldValues?.[field.key]

			if (field.type === 'file') {
				acc[field.key] = []

				return acc
			}

			if (Array.isArray(rawValue)) {
				acc[field.key] = rawValue[0] || ''

				return acc
			}

			if (field.type === 'number' && typeof rawValue === 'number' && Number.isFinite(rawValue)) {
				acc[field.key] = String(rawValue)

				return acc
			}

			acc[field.key] = typeof rawValue === 'string' ? rawValue : ''

			return acc
		}, initialValues)

		setCategoryFieldValues(mappedValues)
	}, [award, category?.id, category?.fieldsExpanded])

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
			toast.error('Заполните обязательные поля')

			return
		}

		const missingRequiredField = category.fieldsExpanded.find((field) => {
			if (!field.required) return false

			const value = categoryFieldValues[field.key]

			if (field.type === 'file') {
				const hasNewFile = Array.isArray(value) && value.length > 0
				const existingFile = existingFileValues[field.key]

				return !hasNewFile && !existingFile
			}

			if (Array.isArray(value)) return value.length === 0

			return !String(value || '').trim()
		})

		if (missingRequiredField) {
			toast.error(`Заполните обязательное поле: ${getLocaleText(missingRequiredField.label, locale)}`)

			return
		}

		const invalidUrlField = findInvalidUrlCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (invalidUrlField) {
			toast.error(
				`Поле «${getLocaleText(invalidUrlField.label, locale)}» должно содержать корректный домен/ссылку без https://`,
			)

			return
		}

		const futureDateField = findFutureDateCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (futureDateField) {
			toast.error(`Поле «${getLocaleText(futureDateField.label, locale)}» не может быть будущей датой`)

			return
		}

		const fieldValues = category.fieldsExpanded.reduce<Record<string, string | string[] | number>>((acc, field) => {
			const value = categoryFieldValues[field.key]

			if (field.type === 'file') {
				if (Array.isArray(value) && value[0]) {
					acc[field.key] = ['']

					return acc
				}

				acc[field.key] = existingFileValues[field.key] || ''

				return acc
			}

			if (field.type === 'url') {
				acc[field.key] = typeof value === 'string' ? withHttpsProtocol(value) : ''

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

			acc[field.key] = typeof value === 'string' ? value : ''

			return acc
		}, {})

		const filesByField = category.fieldsExpanded.reduce<Record<string, File>>((acc, field) => {
			if (field.type !== 'file') return acc

			const value = categoryFieldValues[field.key]

			if (!Array.isArray(value) || !value[0]) return acc

			acc[field.key] = value[0]

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

		toast.loading('Сохранение изменений...', { id: toastId })

		mutateUpdate(
			{ changedAward, id: award.id, filesByField },
			{
				onSuccess: () => {
					toast.success('Данные успешно обновлены', { id: toastId })
					push(`/kpi/${id}`)
				},
				onError: (error) => {
					let errorMessage = 'Ошибка при обновлении данных'

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

					toast.error('Ошибка при обновлении данных', { description: errorMessage, id: toastId })
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
		return <p className='p-6 text-center text-muted-foreground'>Награда не найдена</p>
	}

	if (!category) {
		return <p className='p-6 text-center text-muted-foreground'>Категория не найдена</p>
	}

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle backHref={`/kpi/${id}`} description='Редактирование данных'>
				Редактирование данных
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>Редактирование данных</CardTitle>
					<CardDescription>Изменяйте только те поля, которые заполнялись при создании</CardDescription>
				</CardHeader>

				<CardContent className='space-y-5'>
					<CategoryFieldsSection
						emptyText='Нет полей кроме URL/FILE'
						fields={topCategoryFields}
						values={categoryFieldValues}
						onChange={handleCategoryFieldChange}
					/>

					<Separator />

					<AwardTypeSelectionFields
						availableTypes={availableTypes}
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
						typeLabel='Тип награды'
					/>

					{bottomCategoryFields.length > 0 && (
						<>
							<Separator />

							<CategoryFieldsSection
								columns={1}
								fields={bottomCategoryFields}
								title='Файл или ссылка на файл'
								values={categoryFieldValues}
								onChange={handleCategoryFieldChange}
							/>

							{Object.keys(existingFileValues).length > 0 && (
								<div className='rounded-md border border-dashed p-3 space-y-2'>
									<h4 className='text-sm font-semibold'>Текущие загруженные файлы</h4>
									<ul className='space-y-1 text-sm'>
										{Object.entries(existingFileValues).map(([fieldKey, fileUrl]) => {
											const hasNewFile =
												Array.isArray(categoryFieldValues[fieldKey]) &&
												(categoryFieldValues[fieldKey] as File[]).length > 0

											if (hasNewFile) return null

											return (
												<li key={fieldKey}>
													<span className='text-muted-foreground mr-2'>{fieldKey}:</span>
													<a
														className='text-primary hover:underline break-all'
														href={fileUrl}
														rel='noopener noreferrer'
														target='_blank'
													>
														Открыть текущий файл
													</a>
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
						Сохранить изменения
					</Button>
				</CardFooter>
			</Card>
		</section>
	)
}

export default Page
