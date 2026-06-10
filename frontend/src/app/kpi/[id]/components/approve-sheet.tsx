'use client'

import { useEffect, useMemo, useState } from 'react'

import { getLocaleText, getUILocaleSection } from '@helpers'
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { CriteriaMethodEnum, type ICriteria, type IVariant } from '@types'

import localeDictionary from './locale.json'

const NO_BONUS_CRITERIA_VALUE = '__none__'

interface IApproveSheetProps {
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	onStatusChange: (variantId: string, criteriaId: string, bonusCriteriaId: string | null, awardPoints: number) => void
	variantOptions: IVariant[]
	selectedVariant?: IVariant | null
	selectedCriteria?: ICriteria | null
	selectedBonusCriteria?: ICriteria | null
}

const resolveInitialSelection = (
	variantOptions: IVariant[],
	selectedVariant: IVariant | null,
	selectedCriteria: ICriteria | null,
	selectedBonusCriteria: ICriteria | null,
) => {
	const initialVariant =
		(selectedVariant && variantOptions.some((variant) => variant.id === selectedVariant.id)
			? selectedVariant
			: null) ??
		variantOptions[0] ??
		selectedVariant ??
		null

	const criteriaOptions = initialVariant?.criteria ?? []
	const initialCriteria =
		(selectedCriteria && criteriaOptions.some((criteria) => criteria.id === selectedCriteria.id)
			? selectedCriteria
			: null) ??
		criteriaOptions[0] ??
		selectedCriteria ??
		null

	const bonusCriteriaOptions = initialVariant?.bonus_criteria ?? []
	const initialBonusCriteria =
		(selectedBonusCriteria && bonusCriteriaOptions.some((criteria) => criteria.id === selectedBonusCriteria.id)
			? selectedBonusCriteria
			: null) ?? null

	return {
		variantId: initialVariant?.id ?? '',
		criteriaId: initialCriteria?.id ?? '',
		bonusCriteriaId: initialBonusCriteria?.id ?? NO_BONUS_CRITERIA_VALUE,
	}
}

export const ApproveSheet = ({
	isOpen,
	onOpenChange,
	onStatusChange,
	variantOptions = [],
	selectedVariant = null,
	selectedCriteria = null,
	selectedBonusCriteria = null,
}: IApproveSheetProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).approveSheet

	const [isEditing, setIsEditing] = useState(false)
	const initialSelection = resolveInitialSelection(
		variantOptions,
		selectedVariant,
		selectedCriteria,
		selectedBonusCriteria,
	)
	const [currentVariantId, setCurrentVariantId] = useState(initialSelection.variantId)
	const [currentCriteriaId, setCurrentCriteriaId] = useState(initialSelection.criteriaId)
	const [currentBonusCriteriaId, setCurrentBonusCriteriaId] = useState(initialSelection.bonusCriteriaId)

	const currentVariant = useMemo(
		() => variantOptions.find((variant) => variant.id === currentVariantId) || selectedVariant || null,
		[currentVariantId, selectedVariant, variantOptions],
	)
	const currentCriteriaOptions = currentVariant?.criteria ?? []
	const currentCriteria = useMemo(
		() =>
			currentCriteriaOptions.find((criteria) => criteria.id === currentCriteriaId) ||
			currentCriteriaOptions[0] ||
			null,
		[currentCriteriaId, currentCriteriaOptions],
	)
	const currentBonusCriteriaOptions = currentVariant?.bonus_criteria ?? []
	const currentBonusCriteria = useMemo(
		() =>
			currentBonusCriteriaOptions.find((criteria) => criteria.id === currentBonusCriteriaId) ||
			(currentBonusCriteriaId === NO_BONUS_CRITERIA_VALUE ? null : currentBonusCriteriaOptions[0] || null),
		[currentBonusCriteriaId, currentBonusCriteriaOptions],
	)

	const currentPoints = currentCriteria?.points ?? []
	const isMeasuring = currentCriteria?.method === CriteriaMethodEnum.MEASURING
	const min = currentPoints[0] ?? 0
	const max = currentPoints[currentPoints.length - 1] ?? min
	const variantName = currentVariant ? getLocaleText(currentVariant.name, locale) : ''
	const criteriaName = currentCriteria ? getLocaleText(currentCriteria.name, locale) : ''
	const bonusCriteriaName = currentBonusCriteria ? getLocaleText(currentBonusCriteria.name, locale) : t.noBonusCriteria
	const [awardPoints, setAwardPoints] = useState<number>(min)

	useEffect(() => {
		const nextSelection = resolveInitialSelection(
			variantOptions,
			selectedVariant,
			selectedCriteria,
			selectedBonusCriteria,
		)

		setIsEditing(false)
		setCurrentVariantId(nextSelection.variantId)
		setCurrentCriteriaId(nextSelection.criteriaId)
		setCurrentBonusCriteriaId(nextSelection.bonusCriteriaId)
	}, [isOpen, selectedBonusCriteria?.id, selectedCriteria?.id, selectedVariant?.id, variantOptions])

	useEffect(() => {
		setAwardPoints(min)
	}, [currentCriteria?.id, min])

	useEffect(() => {
		if (
			currentBonusCriteriaId !== NO_BONUS_CRITERIA_VALUE &&
			!currentBonusCriteriaOptions.some((criteria) => criteria.id === currentBonusCriteriaId)
		) {
			setCurrentBonusCriteriaId(NO_BONUS_CRITERIA_VALUE)
		}
	}, [currentBonusCriteriaId, currentBonusCriteriaOptions])

	const handleVariantChange = (variantId: string) => {
		setCurrentVariantId(variantId)

		const nextVariant = variantOptions.find((variant) => variant.id === variantId) || null

		setCurrentCriteriaId(nextVariant?.criteria[0]?.id ?? '')
		setCurrentBonusCriteriaId(NO_BONUS_CRITERIA_VALUE)
	}

	const handleEditStart = () => {
		setIsEditing(true)
	}

	const handleEditCancel = () => {
		const nextSelection = resolveInitialSelection(
			variantOptions,
			selectedVariant,
			selectedCriteria,
			selectedBonusCriteria,
		)

		setIsEditing(false)
		setCurrentVariantId(nextSelection.variantId)
		setCurrentCriteriaId(nextSelection.criteriaId)
		setCurrentBonusCriteriaId(nextSelection.bonusCriteriaId)
	}

	const handleEditSave = () => {
		setIsEditing(false)
	}

	const handleApprove = () => {
		if (!currentVariant || !currentCriteria) return

		onStatusChange(currentVariant.id, currentCriteria.id, currentBonusCriteria?.id || null, awardPoints)
		onOpenChange(false)
	}

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{t.title}</SheetTitle>
					<SheetDescription>{t.description}</SheetDescription>
				</SheetHeader>

				<div className='space-y-4 px-3 text-sm'>
					<div className='rounded-lg border bg-muted/40 p-3 space-y-3'>
						<div className='flex items-center justify-between gap-2'>
							<p className='text-sm font-medium'>{t.selectionTitle}</p>
							{!isEditing ? (
								<Button size='sm' type='button' variant='outline' onClick={handleEditStart}>
									{t.edit}
								</Button>
							) : (
								<div className='flex items-center gap-2'>
									<Button size='sm' type='button' variant='outline' onClick={handleEditCancel}>
										{t.cancelEdit}
									</Button>
									<Button size='sm' type='button' variant='secondary' onClick={handleEditSave}>
										{t.saveSelection}
									</Button>
								</div>
							)}
						</div>

						<div className='space-y-2 text-sm'>
							<p>
								<span className='text-muted-foreground'>{t.variantLabel}:</span>{' '}
								<span className='font-medium'>{variantName || t.empty}</span>
							</p>
							<p>
								<span className='text-muted-foreground'>{t.criteriaLabel}:</span>{' '}
								<span className='font-medium'>{criteriaName || t.empty}</span>
							</p>
							<p>
								<span className='text-muted-foreground'>{t.bonusCriteriaLabel}:</span>{' '}
								<span className='font-medium'>{bonusCriteriaName}</span>
							</p>
							<p>
								<span className='text-muted-foreground'>{t.methodLabel}:</span>{' '}
								<span className='font-medium'>
									{currentCriteria?.method === CriteriaMethodEnum.NORMAL ? t.methodFixed : t.methodMeasuring}
								</span>
							</p>
						</div>
					</div>

					{isEditing && (
						<div className='space-y-3'>
							{variantOptions.length > 1 && (
								<div className='space-y-2'>
									<Label htmlFor='variant-select'>{t.variantSelectLabel}</Label>
									<Select value={currentVariantId} onValueChange={handleVariantChange}>
										<SelectTrigger className='w-full' id='variant-select'>
											<SelectValue placeholder={t.variantSelectPlaceholder} />
										</SelectTrigger>
										<SelectContent>
											{variantOptions.map((variant) => (
												<SelectItem key={variant.id} value={variant.id}>
													{getLocaleText(variant.name, locale)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							{currentCriteriaOptions.length > 1 && (
								<div className='space-y-2'>
									<Label htmlFor='criteria-select'>{t.criteriaSelectLabel}</Label>
									<Select
										value={currentCriteriaId}
										onValueChange={(value) => {
											setCurrentCriteriaId(value)
										}}
									>
										<SelectTrigger className='w-full' id='criteria-select'>
											<SelectValue placeholder={t.criteriaSelectPlaceholder} />
										</SelectTrigger>
										<SelectContent>
											{currentCriteriaOptions.map((criteria) => (
												<SelectItem key={criteria.id} value={criteria.id}>
													{getLocaleText(criteria.name, locale)} ({criteria.points.join('-')} баллов)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							{currentBonusCriteriaOptions.length > 0 && (
								<div className='space-y-2'>
									<Label htmlFor='bonus-criteria-select'>{t.bonusCriteriaSelectLabel}</Label>
									<Select value={currentBonusCriteriaId} onValueChange={setCurrentBonusCriteriaId}>
										<SelectTrigger className='w-full' id='bonus-criteria-select'>
											<SelectValue placeholder={t.bonusCriteriaSelectPlaceholder} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={NO_BONUS_CRITERIA_VALUE}>{t.noBonusCriteria}</SelectItem>
											{currentBonusCriteriaOptions.map((criteria) => (
												<SelectItem key={criteria.id} value={criteria.id}>
													{getLocaleText(criteria.name, locale)} ({criteria.points.join('-')} баллов)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>
					)}

					{currentCriteria?.method === CriteriaMethodEnum.NORMAL && (
						<div className='rounded-md border bg-muted px-3 py-2'>
							<p>
								{t.pointsLabel}: <span className='font-semibold'>{currentCriteria.points[0]}</span>
							</p>
						</div>
					)}

					{isMeasuring && (
						<div className='space-y-2'>
							<Label htmlFor='points'>
								{t.scoreLabel} ({min} - {max})
							</Label>
							<Input
								id='points'
								max={max}
								min={min}
								type='number'
								value={awardPoints}
								onChange={(e) => {
									const value = Number(e.target.value)

									if (Number.isNaN(value)) return

									setAwardPoints(Math.min(Math.max(value, min), max))
								}}
							/>
						</div>
					)}
				</div>

				<SheetFooter className='mt-4'>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						{t.cancel}
					</Button>
					<Button disabled={!currentVariant || !currentCriteria} variant='default' onClick={handleApprove}>
						{t.approve}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
