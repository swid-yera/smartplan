import { useEffect } from 'react'

import { getLocaleText, interpolateUILocaleText } from '@helpers'
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
	labels: {
		typePlaceholder: string
		variantLabel: string
		variantPlaceholder: string
		criteriaLabel: string
		criteriaPlaceholder: string
		bonusCriteriaLabel: string
		bonusCriteriaPlaceholder: string
		selectTypeHint: string
		selectVariantHint: string
		criteriaPoints: string
		bonusCriteriaPoints: string
	}
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
	labels,
	layout = 'stack',
	showVariantDescription = false,
	showHints = false,
	bonusCriteriaOptionsSource = 'bonus',
}: AwardTypeSelectionFieldsProps) => {
	const isCriteriaValidInList = (criteria: ICriteriaResponse | null, list: ICriteriaResponse[] | null | undefined) =>
		!!criteria && !!list?.some((item) => item.id === criteria.id)

	useEffect(() => {
		if (availableTypes.length !== 1) return

		const onlyType = availableTypes[0]

		if (selectedType?.id === onlyType.id) return

		setSelectedType(onlyType)

		const nextVariant =
			selectedVariant && onlyType.variants.some((variant) => variant.id === selectedVariant.id)
				? selectedVariant
				: onlyType.variants[0] || null

		if (nextVariant?.id !== selectedVariant?.id) {
			setSelectedVariant(nextVariant)
		}

		const criteriaList = nextVariant?.criteria || []
		if (!isCriteriaValidInList(selectedCriteria, criteriaList)) {
			setSelectedCriteria(criteriaList.length === 1 ? criteriaList[0] : null)
		}

		const bonusCriteriaList =
			bonusCriteriaOptionsSource === 'criteria' ? criteriaList : nextVariant?.bonus_criteria || []
		if (!isCriteriaValidInList(selectedBonusCriteria, bonusCriteriaList)) {
			setSelectedBonusCriteria(bonusCriteriaList.length === 1 ? bonusCriteriaList[0] : null)
		}
	}, [
		availableTypes,
		bonusCriteriaOptionsSource,
		selectedBonusCriteria,
		selectedCriteria,
		selectedType,
		setSelectedType,
		setSelectedVariant,
		setSelectedCriteria,
		setSelectedBonusCriteria,
		selectedVariant,
	])

	useEffect(() => {
		if (!selectedType) return

		const isSelectedVariantValid =
			!!selectedVariant && selectedType.variants.some((variant) => variant.id === selectedVariant.id)

		if (!isSelectedVariantValid && selectedVariant) {
			const nextVariant = selectedType.variants[0] || null

			setSelectedVariant(nextVariant)

			const criteriaList = nextVariant?.criteria || []
			if (!isCriteriaValidInList(selectedCriteria, criteriaList)) {
				setSelectedCriteria(criteriaList.length === 1 ? criteriaList[0] : null)
			}

			const bonusCriteriaList =
				bonusCriteriaOptionsSource === 'criteria' ? criteriaList : nextVariant?.bonus_criteria || []
			if (!isCriteriaValidInList(selectedBonusCriteria, bonusCriteriaList)) {
				setSelectedBonusCriteria(bonusCriteriaList.length === 1 ? bonusCriteriaList[0] : null)
			}

			return
		}

		if (selectedType.variants.length !== 1) return

		const onlyVariant = selectedType.variants[0]

		if (selectedVariant?.id === onlyVariant.id) return

		setSelectedVariant(onlyVariant)

		const criteriaList = onlyVariant.criteria || []
		if (!isCriteriaValidInList(selectedCriteria, criteriaList)) {
			setSelectedCriteria(criteriaList.length === 1 ? criteriaList[0] : null)
		}

		const bonusCriteriaList =
			bonusCriteriaOptionsSource === 'criteria' ? criteriaList : onlyVariant.bonus_criteria || []
		if (!isCriteriaValidInList(selectedBonusCriteria, bonusCriteriaList)) {
			setSelectedBonusCriteria(bonusCriteriaList.length === 1 ? bonusCriteriaList[0] : null)
		}
	}, [
		bonusCriteriaOptionsSource,
		selectedCriteria,
		selectedBonusCriteria,
		selectedType,
		selectedVariant,
		setSelectedVariant,
		setSelectedCriteria,
		setSelectedBonusCriteria,
	])

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
			<Label htmlFor='variant'>{labels.variantLabel}</Label>
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
					<SelectValue placeholder={labels.variantPlaceholder} />
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
				<p className='ml-2 text-xs text-muted-foreground'>{labels.selectTypeHint}</p>
			) : null}
		</div>
	)

	const criteriaField = (
		<div className='space-y-2'>
			<Label htmlFor='criteria'>{labels.criteriaLabel}</Label>
			<Select
				disabled={!selectedVariant || !selectedVariant.criteria.length}
				value={selectedCriteria?.id || ''}
				onValueChange={(id: string) => {
					const criteria = selectedVariant?.criteria.find((item) => item.id === id) || null

					setSelectedCriteria(criteria)
				}}
			>
				<SelectTrigger className='w-full' id='criteria'>
					<SelectValue placeholder={labels.criteriaPlaceholder} />
				</SelectTrigger>
				<SelectContent>
					{(selectedVariant?.criteria || []).map((criteria) => (
						<SelectItem key={criteria.id} value={criteria.id}>
							{getLocaleText(criteria.name, locale)}{' '}
							{interpolateUILocaleText(labels.criteriaPoints, { points: criteria.points.join('-') })}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{showHints && !selectedVariant ? (
				<p className='ml-2 text-xs text-muted-foreground'>{labels.selectVariantHint}</p>
			) : null}
		</div>
	)

	const bonusCriteriaOptions =
		bonusCriteriaOptionsSource === 'criteria' ? selectedVariant?.criteria || [] : selectedVariant?.bonus_criteria || []

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
						<SelectValue placeholder={labels.typePlaceholder} />
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

			{selectedVariant?.bonus_criteria?.length ? (
				<div className='space-y-2'>
					<Label htmlFor='bonus-criteria'>{labels.bonusCriteriaLabel}</Label>
					<Select
						value={selectedBonusCriteria?.id || ''}
						onValueChange={(id: string) => {
							const criteria = selectedVariant.bonus_criteria?.find((item) => item.id === id) || null

							setSelectedBonusCriteria(criteria)
						}}
					>
						<SelectTrigger className='w-full' id='bonus-criteria'>
							<SelectValue placeholder={labels.bonusCriteriaPlaceholder} />
						</SelectTrigger>
						<SelectContent>
							{bonusCriteriaOptions.map((criteria) => (
								<SelectItem key={criteria.id} value={criteria.id}>
									{getLocaleText(criteria.name, locale)}{' '}
									{interpolateUILocaleText(labels.bonusCriteriaPoints, { points: criteria.points.join('-') })}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</>
	)
}
