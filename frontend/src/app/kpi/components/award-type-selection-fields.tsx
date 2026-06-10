import { useEffect } from 'react'

import { formatCriteriaPoints, getLocaleText, interpolateUILocaleText } from '@helpers'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn'
import type { ICriteriaResponse, ITypeResponse, IVariantResponse, Locale } from '@types'

const NO_BONUS_CRITERIA_VALUE = '__none__'

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
		noBonusCriteria: string
		selectTypeHint: string
		selectVariantHint: string
		criteriaPoints: string
		bonusCriteriaPoints: string
	}
	layout?: 'stack' | 'grid'
	showVariantDescription?: boolean
	showHints?: boolean
}

const isCriteriaValidInList = (criteria: ICriteriaResponse | null, list: ICriteriaResponse[] | null | undefined) =>
	!!criteria && !!list?.some((item) => item.id === criteria.id)

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
}: AwardTypeSelectionFieldsProps) => {
	useEffect(() => {
		if (availableTypes.length !== 1) return

		const onlyType = availableTypes[0]

		if (selectedType?.id === onlyType.id) return

		setSelectedType(onlyType)
	}, [availableTypes, selectedType, setSelectedType])

	useEffect(() => {
		if (!selectedType) return

		const isSelectedVariantValid =
			!!selectedVariant && selectedType.variants.some((variant) => variant.id === selectedVariant.id)

		if (isSelectedVariantValid) return

		setSelectedVariant(selectedType.variants[0] || null)
	}, [selectedType, selectedVariant, setSelectedVariant])

	useEffect(() => {
		if (!selectedVariant) return

		const criteriaList = selectedVariant.criteria || []

		if (isCriteriaValidInList(selectedCriteria, criteriaList)) return

		setSelectedCriteria(criteriaList.length === 1 ? criteriaList[0] : null)
	}, [selectedCriteria, selectedVariant, setSelectedCriteria])

	useEffect(() => {
		if (!selectedVariant) return

		const bonusCriteriaList = selectedVariant.bonus_criteria || []

		if (!selectedBonusCriteria) return
		if (bonusCriteriaList.some((criteria) => criteria.id === selectedBonusCriteria.id)) return

		setSelectedBonusCriteria(null)
	}, [selectedBonusCriteria, selectedVariant, setSelectedBonusCriteria])

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
					setSelectedBonusCriteria(null)
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
							{interpolateUILocaleText(labels.criteriaPoints, {
								points: formatCriteriaPoints(criteria.points),
							})}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{showHints && !selectedVariant ? (
				<p className='ml-2 text-xs text-muted-foreground'>{labels.selectVariantHint}</p>
			) : null}
		</div>
	)

	const bonusCriteriaOptions = selectedVariant?.bonus_criteria || []
	const showTypeField = availableTypes.length !== 1
	const showVariantField = !selectedType || selectedType.variants.length !== 1
	const showCriteriaField = !selectedVariant || selectedVariant.criteria.length !== 1
	const showBonusCriteriaField = bonusCriteriaOptions.length > 0

	return (
		<>
			{showTypeField ? (
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
			) : null}

			{layout === 'grid' ? (
				<div className={`grid gap-4 ${showVariantField && showCriteriaField ? 'grid-cols-2' : 'grid-cols-1'}`}>
					{showVariantField ? variantField : null}
					{showCriteriaField ? criteriaField : null}
				</div>
			) : null}

			{layout === 'stack' ? (
				<>
					{showVariantField ? variantField : null}
					{showCriteriaField ? criteriaField : null}
				</>
			) : null}

			{showBonusCriteriaField ? (
				<div className='space-y-2'>
					<Label htmlFor='bonus-criteria'>{labels.bonusCriteriaLabel}</Label>
					<Select
						value={selectedBonusCriteria?.id || NO_BONUS_CRITERIA_VALUE}
						onValueChange={(id: string) => {
							if (id === NO_BONUS_CRITERIA_VALUE) {
								setSelectedBonusCriteria(null)

								return
							}

							const criteria = selectedVariant?.bonus_criteria?.find((item) => item.id === id) || null

							setSelectedBonusCriteria(criteria)
						}}
					>
						<SelectTrigger className='w-full' id='bonus-criteria'>
							<SelectValue placeholder={labels.bonusCriteriaPlaceholder} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NO_BONUS_CRITERIA_VALUE}>{labels.noBonusCriteria}</SelectItem>
							{bonusCriteriaOptions.map((criteria) => (
								<SelectItem key={criteria.id} value={criteria.id}>
									{getLocaleText(criteria.name, locale)}{' '}
									{interpolateUILocaleText(labels.bonusCriteriaPoints, {
										points: formatCriteriaPoints(criteria.points),
									})}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			) : null}
		</>
	)
}
