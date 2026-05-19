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
	collectCategoryFieldFiles,
	findFutureDateCategoryField,
	findInvalidUrlCategoryField,
	findMissingRequiredCategoryField,
} from '@components'
import { getCategoryIconOptionByName } from '@helpers'
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
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ICreateAwardRequest, ICriteriaResponse, ITypeResponse, IVariantResponse } from '@types'
import { Folder } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateAwardPage() {
	const params = useParams<{ id: string }>()
	const categoryId = params.id
	const { push } = useRouter()

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

		const missingRequiredField = findMissingRequiredCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (missingRequiredField) {
			toast.error(`Заполните обязательное поле: ${missingRequiredField.label}`)

			return
		}

		const invalidUrlField = findInvalidUrlCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (invalidUrlField) {
			toast.error(`Поле «${invalidUrlField.label}» должно содержать корректный домен/ссылку без https://`)

			return
		}

		const futureDateField = findFutureDateCategoryField(category.fieldsExpanded, categoryFieldValues)

		if (futureDateField) {
			toast.error(`Поле «${futureDateField.label}» не может быть будущей датой`)

			return
		}

		const newAward: ICreateAwardRequest = {
			type: selectedType.id,
			variant: selectedVariant.id,
			criteria: selectedCriteria.id,
		}
		const files = collectCategoryFieldFiles(category.fieldsExpanded, categoryFieldValues)

		const toastId = `award-${selectedType.name}-create`

		toast.loading(`Создание награды в категории - ${category.name}`, { id: toastId })

		mutateCreate(
			{ newAward, files },
			{
				onSuccess: (createdAward) => {
					toast.success(`Награда успешно создана с типом - ${createdAward.type.name}`, { id: toastId })
					push(`/kpi/${createdAward.id}`)
				},
				onError: () => {
					toast.error(`Ошибка создания награды - ${selectedType.name}`, { id: toastId })
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

	return (
		<section className='mx-auto w-full p-6 space-y-6'>
			<PageTitle
				backHref={`/kpi/categories/${category.id}`}
				description='Создание награды с ограничениями и полями выбранной категории'
			>
				Создание награды
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-3'>
						<CategoryIcon className='h-6 w-6 text-primary' />
						<span>{category.name}</span>
					</CardTitle>
					<CardDescription>{category.description || 'Описание категории отсутствует'}</CardDescription>
				</CardHeader>
				<CardContent className='space-y-2'>
					<div className='flex flex-wrap gap-2'>
						{availableTypes.length ? (
							availableTypes.map((type) => (
								<Badge key={type.id} variant='secondary'>
									{type.name}
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
					<CardTitle>Создание награды</CardTitle>
					<CardDescription>
						Сначала заполните поля категории, затем выберите тип, вариант и критерий
					</CardDescription>
				</CardHeader>

				<CardContent className='space-y-5'>
					<CategoryFieldsSection
						emptyText='Нет полей кроме URL/FILE'
						fields={topCategoryFields}
						values={categoryFieldValues}
						onChange={handleCategoryFieldChange}
					/>

					<Separator />

					<div className='space-y-2'>
						<Label htmlFor='type'>Тип награды</Label>
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
										{type.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='grid grid-cols-2 gap-4'>
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
											{variant.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedVariant?.description ? (
								<p className='ml-2 text-xs text-muted-foreground'>{selectedVariant.description}</p>
							) : !selectedType ? (
								<p className='ml-2 text-xs text-muted-foreground'>Сначала выберите тип награды</p>
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
											{criteria.name} ({criteria.points.join('-')} баллов)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{!selectedVariant && (
								<p className='ml-2 text-xs text-muted-foreground'>Сначала выберите вариант</p>
							)}
						</div>
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
											{criteria.name} ({criteria.points.join('-')} бонусных баллов)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{bottomCategoryFields.length > 0 && (
						<>
							<Separator />

							<CategoryFieldsSection
								columns={1}
								fields={bottomCategoryFields}
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
