import { useEffect, useState } from 'react'

import { getUILocaleSection, interpolateUILocaleText } from '@helpers'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { CriteriaMethodEnum, type Locale } from '@types'
import { Plus, Trash } from 'lucide-react'

import localeDictionary from './locale.json'

export interface ILocalizedDraft {
	ru: string
	kk: string
}

export interface ICriteriaForm {
	name: ILocalizedDraft
	points: number[]
	method: CriteriaMethodEnum
}

export interface IVariantForm {
	name: ILocalizedDraft
	description: ILocalizedDraft
	criteria: ICriteriaForm[]
	bonusCriteria: ICriteriaForm[]
}

interface IProps {
	index: number
	locale: Locale
	variant: IVariantForm
	onChange: (v: IVariantForm) => void
	onDelete: () => void
}

type CriteriaListKey = 'criteria' | 'bonusCriteria'

type CriteriaDrafts = string[][]

const createCriteriaDrafts = (criteriaList: ICriteriaForm[]): CriteriaDrafts =>
	criteriaList.map((criteria) => criteria.points.map((point) => String(point)))

const createEmptyCriteria = (): ICriteriaForm => ({
	name: {
		ru: '',
		kk: '',
	},
	points: [0],
	method: CriteriaMethodEnum.NORMAL,
})

const isSignedIntegerDraft = (value: string) => /^-?\d*$/.test(value.trim())
const isCompleteSignedInteger = (value: string) => /^-?\d+$/.test(value.trim())

export const VariantEdit = ({ index, locale, variant, onChange, onDelete }: IProps) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, uiLocale)
	const [criteriaDrafts, setCriteriaDrafts] = useState<CriteriaDrafts>(() => createCriteriaDrafts(variant.criteria))
	const [bonusCriteriaDrafts, setBonusCriteriaDrafts] = useState<CriteriaDrafts>(() =>
		createCriteriaDrafts(variant.bonusCriteria),
	)

	useEffect(() => {
		setCriteriaDrafts(createCriteriaDrafts(variant.criteria))
	}, [variant.criteria])

	useEffect(() => {
		setBonusCriteriaDrafts(createCriteriaDrafts(variant.bonusCriteria))
	}, [variant.bonusCriteria])

	const updateVariantList = (listKey: CriteriaListKey, nextList: ICriteriaForm[]) => {
		onChange({
			...variant,
			[listKey]: nextList,
		})
	}

	const updateCriteriaItem = (
		listKey: CriteriaListKey,
		itemIndex: number,
		updater: (criteria: ICriteriaForm) => ICriteriaForm,
	) => {
		const nextList = [...variant[listKey]]

		nextList[itemIndex] = updater(nextList[itemIndex])

		updateVariantList(listKey, nextList)
	}

	const updateDrafts = (listKey: CriteriaListKey, itemIndex: number, nextDraft: string[]) => {
		const setter = listKey === 'criteria' ? setCriteriaDrafts : setBonusCriteriaDrafts

		setter((prev) => {
			const next = [...prev]

			next[itemIndex] = nextDraft

			return next
		})
	}

	const addCriteriaItem = (listKey: CriteriaListKey) => {
		updateVariantList(listKey, [...variant[listKey], createEmptyCriteria()])
	}

	const removeCriteriaItem = (listKey: CriteriaListKey, itemIndex: number) => {
		updateVariantList(
			listKey,
			variant[listKey].filter((_, index) => index !== itemIndex),
		)
	}

	const renderCriteriaSection = ({
		listKey,
		title,
		addLabel,
		removeLabel,
		namePlaceholder,
		drafts,
	}: {
		listKey: CriteriaListKey
		title: string
		addLabel: string
		removeLabel: string
		namePlaceholder: string
		drafts: CriteriaDrafts
	}) => {
		const criteriaList = variant[listKey]

		return (
			<div className='space-y-2'>
				<div className='flex items-center justify-between'>
					<p className='text-sm font-medium'>{title}</p>
					<Button size='sm' variant='outline' onClick={() => addCriteriaItem(listKey)}>
						<Plus className='mr-2 h-3 w-3' />
						{addLabel}
					</Button>
				</div>

				<ol className='list-[lower-roman] space-y-8 pl-5'>
					{criteriaList.map((criteria, criteriaIndex) => (
						<li key={criteriaIndex} className='space-y-3'>
							<div className='flex items-center gap-2'>
								<Input
									placeholder={namePlaceholder}
									value={criteria.name[locale]}
									onChange={(e) =>
										updateCriteriaItem(listKey, criteriaIndex, (currentCriteria) => ({
											...currentCriteria,
											name: {
												...currentCriteria.name,
												[locale]: e.target.value,
											},
										}))
									}
								/>
								<Button
									aria-label={removeLabel}
									size='icon'
									type='button'
									variant='ghost'
									onClick={() => removeCriteriaItem(listKey, criteriaIndex)}
								>
									<Trash className='h-4 w-4 text-muted-foreground' />
								</Button>
							</div>

							<div className='flex gap-3'>
								<Select
									value={criteria.method}
									onValueChange={(value: CriteriaMethodEnum) => {
										const nextPoints =
											value === CriteriaMethodEnum.NORMAL
												? [criteria.points?.[0] ?? 0]
												: [criteria.points?.[0] ?? 0, criteria.points?.[1] ?? criteria.points?.[0] ?? 0]

										updateCriteriaItem(listKey, criteriaIndex, (currentCriteria) => ({
											...currentCriteria,
											method: value,
											points: nextPoints,
										}))
										updateDrafts(
											listKey,
											criteriaIndex,
											nextPoints.map((point) => String(point)),
										)
									}}
								>
									<SelectTrigger className='w-48'>
										<SelectValue placeholder={t.methodPlaceholder} />
									</SelectTrigger>

									<SelectContent>
										<SelectItem value={CriteriaMethodEnum.NORMAL}>{t.fixedMethod}</SelectItem>
										<SelectItem value={CriteriaMethodEnum.MEASURING}>{t.rangeMethod}</SelectItem>
									</SelectContent>
								</Select>

								{criteria.method === CriteriaMethodEnum.NORMAL ? (
									<Input
										placeholder={t.pointsPlaceholder}
										type='text'
										value={drafts[criteriaIndex]?.[0] ?? String(criteria.points?.[0] ?? 0)}
										onChange={(e) => {
											const rawValue = e.target.value

											if (!isSignedIntegerDraft(rawValue)) return

											updateDrafts(listKey, criteriaIndex, [rawValue])

											if (!isCompleteSignedInteger(rawValue)) return

											updateCriteriaItem(listKey, criteriaIndex, (currentCriteria) => ({
												...currentCriteria,
												points: [Number(rawValue)],
											}))
										}}
									/>
								) : (
									<div className='flex gap-2'>
										<Input
											placeholder={t.minPlaceholder}
											type='text'
											value={drafts[criteriaIndex]?.[0] ?? String(criteria.points?.[0] ?? 0)}
											onChange={(e) => {
												const rawMin = e.target.value

												if (!isSignedIntegerDraft(rawMin)) return

												const currentDraft = drafts[criteriaIndex] ?? [
													String(criteria.points?.[0] ?? 0),
													String(criteria.points?.[1] ?? criteria.points?.[0] ?? 0),
												]

												updateDrafts(listKey, criteriaIndex, [
													rawMin,
													currentDraft[1] ?? String(criteria.points?.[1] ?? criteria.points?.[0] ?? 0),
												])

												if (!isCompleteSignedInteger(rawMin)) return

												const min = Number(rawMin)
												const rawMax =
													currentDraft[1] ?? String(criteria.points?.[1] ?? criteria.points?.[0] ?? min)
												const max = isCompleteSignedInteger(rawMax)
													? Number(rawMax)
													: (criteria.points?.[1] ?? min)

												updateCriteriaItem(listKey, criteriaIndex, (currentCriteria) => ({
													...currentCriteria,
													points: [Math.min(min, max), Math.max(min, max)],
												}))
											}}
										/>

										<Input
											placeholder={t.maxPlaceholder}
											type='text'
											value={
												drafts[criteriaIndex]?.[1] ??
												String(criteria.points?.[1] ?? criteria.points?.[0] ?? 0)
											}
											onChange={(e) => {
												const rawMax = e.target.value

												if (!isSignedIntegerDraft(rawMax)) return

												const currentDraft = drafts[criteriaIndex] ?? [
													String(criteria.points?.[0] ?? 0),
													String(criteria.points?.[1] ?? criteria.points?.[0] ?? 0),
												]

												updateDrafts(listKey, criteriaIndex, [
													currentDraft[0] ?? String(criteria.points?.[0] ?? 0),
													rawMax,
												])

												if (!isCompleteSignedInteger(rawMax)) return

												const max = Number(rawMax)
												const rawMin = currentDraft[0] ?? String(criteria.points?.[0] ?? 0)
												const min = isCompleteSignedInteger(rawMin)
													? Number(rawMin)
													: (criteria.points?.[0] ?? max)

												updateCriteriaItem(listKey, criteriaIndex, (currentCriteria) => ({
													...currentCriteria,
													points: [Math.min(min, max), Math.max(min, max)],
												}))
											}}
										/>
									</div>
								)}
							</div>
						</li>
					))}
				</ol>
			</div>
		)
	}

	return (
		<Card className='relative'>
			<CardHeader className='pb-2'>
				<div className='flex items-start justify-between'>
					<CardTitle className='text-base'>
						{interpolateUILocaleText(t.variantTitle, { index: index + 1 })}
					</CardTitle>

					<Button size='icon' variant='ghost' onClick={onDelete}>
						<Trash className='h-4 w-4 text-muted-foreground' />
					</Button>
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				<Input
					placeholder={t.variantNamePlaceholder}
					value={variant.name[locale]}
					onChange={(e) =>
						onChange({
							...variant,
							name: {
								...variant.name,
								[locale]: e.target.value,
							},
						})
					}
				/>

				<Input
					placeholder={t.variantDescriptionPlaceholder}
					value={variant.description[locale]}
					onChange={(e) =>
						onChange({
							...variant,
							description: {
								...variant.description,
								[locale]: e.target.value,
							},
						})
					}
				/>

				{renderCriteriaSection({
					listKey: 'criteria',
					title: t.criteriaTitle,
					addLabel: t.addCriteria,
					removeLabel: t.removeCriteria,
					namePlaceholder: t.criteriaNamePlaceholder,
					drafts: criteriaDrafts,
				})}

				{renderCriteriaSection({
					listKey: 'bonusCriteria',
					title: t.bonusCriteriaTitle,
					addLabel: t.addBonusCriteria,
					removeLabel: t.removeBonusCriteria,
					namePlaceholder: t.bonusCriteriaNamePlaceholder,
					drafts: bonusCriteriaDrafts,
				})}
			</CardContent>
		</Card>
	)
}
