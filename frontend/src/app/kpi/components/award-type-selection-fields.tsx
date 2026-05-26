import { useEffect } from 'react'

import { getLocaleText } from '@helpers'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn'
import type { ICriteriaResponse, ITypeResponse, IVariantResponse, Locale } from '@types'

type BonusCriteriaOptionsSource = 'bonus' | 'criteria'

type AwardTypeSelectionFieldsProps = {
	availableTypes: ITypeResponse[]
	selectedType: ITypeResponse | null
	selectedVariant: IVariantResponse | null
	selectedCriteria: ICriteriaResponse | null
	selectedBonusCriteria: ICriteriaResponse | null
	setSelectedType: (value: ITypeResponse | null) => void
	setSelectedVariant: (value: IVariantResponse | null) => void
	setSelectedCriteria: (value: ICriteriaResponse | null) => void
	setSelectedBonusCriteria: (value: ICriteriaResponse | null) => void
	locale: Locale
	typeLabel: string
	layout?: 'stack' | 'grid'
	showVariantDescription?: boolean
	showHints?: boolean
	bonusCriteriaOptionsSource?: BonusCriteriaOptionsSource
}

export const AwardTypeSelectionFields = ({
	availableTypes,
	selectedType,
	selectedVariant,
	selectedCriteria,
	selectedBonusCriteria,
	setSelectedType,
	setSelectedVariant,
	setSelectedCriteria,
	setSelectedBonusCriteria,
	locale,
	typeLabel,
	layout = 'stack',
	showVariantDescription = false,
	showHints = false,
	bonusCriteriaOptionsSource = 'bonus',
}: AwardTypeSelectionFieldsProps) => {
	useEffect(() => {
		if (availableTypes.length !== 1) return

		const onlyType = availableTypes[0]

		if (selectedType?.id === onlyType.id) return

		setSelectedType(onlyType)
		setSelectedVariant(null)
		setSelectedCriteria(null)
		setSelectedBonusCriteria(null)
	}, [
		availableTypes,
		selectedType,
		setSelectedType,
		setSelectedVariant,
		setSelectedCriteria,
		setSelectedBonusCriteria,
	])

	useEffect(() => {
		if (!selectedType) return

		const isSelectedVariantValid =
			!!selectedVariant && selectedType.variants.some((variant) => variant.id === selectedVariant.id)

		if (!isSelectedVariantValid && selectedVariant) {
			setSelectedVariant(null)
			setSelectedCriteria(null)
			setSelectedBonusCriteria(null)

			return
		}

		if (selectedType.variants.length !== 1) return

		const onlyVariant = selectedType.variants[0]

		if (selectedVariant?.id === onlyVariant.id) return

		setSelectedVariant(onlyVariant)
		setSelectedCriteria(null)
		setSelectedBonusCriteria(null)
	}, [selectedType, selectedVariant, setSelectedVariant, setSelectedCriteria, setSelectedBonusCriteria])

	useEffect(() => {
		if (!selectedVariant) return

		const isSelectedCriteriaValid =
			!!selectedCriteria && selectedVariant.criteria.some((criteria) => criteria.id === selectedCriteria.id)

		if (!isSelectedCriteriaValid && selectedCriteria) {
			setSelectedCriteria(null)

			return
		}

		if (selectedVariant.criteria.length !== 1) return

		const onlyCriteria = selectedVariant.criteria[0]

		if (selectedCriteria?.id === onlyCriteria.id) return

		setSelectedCriteria(onlyCriteria)
	}, [selectedVariant, selectedCriteria, setSelectedCriteria])

	const variantField = (
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
			{showVariantDescription && selectedVariant?.description ? (
				<p className='ml-2 text-xs text-muted-foreground'>{getLocaleText(selectedVariant.description, locale)}</p>
			) : null}
			{showHints && !selectedType ? (
				<p className='ml-2 text-xs text-muted-foreground'>Сначала выберите тип оценивания</p>
			) : null}
		</div>
	)

	const criteriaField = (
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
			{showHints && !selectedVariant ? (
				<p className='ml-2 text-xs text-muted-foreground'>Сначала выберите вариант</p>
			) : null}
		</div>
	)

	const bonusCriteriaOptions =
		bonusCriteriaOptionsSource === 'criteria' ? selectedVariant?.criteria || [] : selectedVariant?.bonusCriteria || []

	return (
		<>
			<div className='space-y-2'>
				<Label htmlFor='type'>{typeLabel}</Label>
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

			{layout === 'grid' ? (
				<div className='grid grid-cols-2 gap-4'>
					{variantField}
					{criteriaField}
				</div>
			) : null}
			{layout === 'stack' ? (
				<>
					{variantField}
					{criteriaField}
				</>
			) : null}

			{selectedVariant?.bonusCriteria?.length ? (
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
							{bonusCriteriaOptions.map((criteria) => (
								<SelectItem key={criteria.id} value={criteria.id}>
									{getLocaleText(criteria.name, locale)} ({criteria.points.join('-')} бонусных баллов)
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</>
	)
}
