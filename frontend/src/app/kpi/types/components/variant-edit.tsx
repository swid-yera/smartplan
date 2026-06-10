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
import type { Locale } from '@types'
import { CriteriaMethodEnum } from '@types'
import { useEffect, useState } from 'react'
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

export const VariantEdit = ({ index, locale, variant, onChange, onDelete }: IProps) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, uiLocale)
	const [criteriaDrafts, setCriteriaDrafts] = useState<string[][]>(() =>
		variant.criteria.map((criteria) => criteria.points.map((point) => String(point))),
	)

	useEffect(() => {
		setCriteriaDrafts(variant.criteria.map((criteria) => criteria.points.map((point) => String(point))))
	}, [variant.criteria])

	const isSignedIntegerDraft = (value: string) => /^-?\d*$/.test(value.trim())
	const isCompleteSignedInteger = (value: string) => /^-?\d+$/.test(value.trim())

	const updateCriteria = (criteriaIndex: number, updater: (criteria: ICriteriaForm) => ICriteriaForm) => {
		const next = [...variant.criteria]
		next[criteriaIndex] = updater(next[criteriaIndex])

		onChange({ ...variant, criteria: next })
	}

	const updateCriteriaDraft = (criteriaIndex: number, draft: string[]) => {
		setCriteriaDrafts((prev) => {
			const next = [...prev]
			next[criteriaIndex] = draft
			return next
		})
	}

	const addCriteria = () => {
		const newCriteria: ICriteriaForm = {
			name: {
				ru: '',
				kk: '',
			},
			points: [0],
			method: CriteriaMethodEnum.NORMAL,
		}

		onChange({
			...variant,
			criteria: [...variant.criteria, newCriteria],
		})
	}
	const removeCriteria = (criteriaIndex: number) => {
		onChange({
			...variant,
			criteria: variant.criteria.filter((_, index) => index !== criteriaIndex),
		})
	}

	return (
		<Card className='relative'>
			<CardHeader className='pb-2'>
				<div className='flex items-start justify-between'>
					<CardTitle className='text-base'>{interpolateUILocaleText(t.variantTitle, { index: index + 1 })}</CardTitle>

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

				{/* criteria */}
				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<p className='text-sm font-medium'>{t.criteriaTitle}</p>
						<Button size='sm' variant='outline' onClick={addCriteria}>
							<Plus className='mr-2 h-3 w-3' />
							{t.addCriteria}
						</Button>
					</div>

					<ol className='list-[lower-roman] space-y-8 pl-5'>
						{variant.criteria.map((c, i) => (
							<li key={i} className='space-y-3'>
								<div className='flex items-center gap-2'>
									<Input
										placeholder={t.criteriaNamePlaceholder}
										value={c.name[locale]}
										onChange={(e) => {
											const next = [...variant.criteria]

											next[i] = {
												...c,
												name: {
													...c.name,
													[locale]: e.target.value,
												},
											}
											onChange({ ...variant, criteria: next })
										}}
									/>
									<Button
										aria-label={t.removeCriteria}
										size='icon'
										type='button'
										variant='ghost'
										onClick={() => removeCriteria(i)}
									>
										<Trash className='h-4 w-4 text-muted-foreground' />
									</Button>
								</div>

								<div className='flex gap-3'>
									{/* method */}
									<Select
										value={c.method}
										onValueChange={(value: CriteriaMethodEnum) => {
											const nextPoints =
												value === CriteriaMethodEnum.NORMAL
													? [c.points?.[0] ?? 0]
													: [c.points?.[0] ?? 0, c.points?.[1] ?? c.points?.[0] ?? 0]

											updateCriteria(i, (criteria) => ({
												...criteria,
												method: value,
												points: nextPoints,
											}))
											updateCriteriaDraft(i, nextPoints.map((point) => String(point)))
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

									{/* points */}
									{c.method === CriteriaMethodEnum.NORMAL ? (
											<Input
											placeholder={t.pointsPlaceholder}
											type='text'
											value={criteriaDrafts[i]?.[0] ?? String(c.points?.[0] ?? 0)}
											onChange={(e) => {
												const rawValue = e.target.value
												if (!isSignedIntegerDraft(rawValue)) return

												updateCriteriaDraft(i, [rawValue])

												if (!isCompleteSignedInteger(rawValue)) return

												updateCriteria(i, (criteria) => ({
													...criteria,
													points: [Number(rawValue)],
												}))
											}}
										/>
									) : (
										<div className='flex gap-2'>
											<Input
												placeholder={t.minPlaceholder}
												type='text'
												value={criteriaDrafts[i]?.[0] ?? String(c.points?.[0] ?? 0)}
												onChange={(e) => {
													const rawMin = e.target.value
													if (!isSignedIntegerDraft(rawMin)) return

													const currentDraft = criteriaDrafts[i] ?? [
														String(c.points?.[0] ?? 0),
														String(c.points?.[1] ?? c.points?.[0] ?? 0),
													]
													updateCriteriaDraft(i, [rawMin, currentDraft[1] ?? String(c.points?.[1] ?? c.points?.[0] ?? 0)])

													if (!isCompleteSignedInteger(rawMin)) return

													const min = Number(rawMin)
													const rawMax = currentDraft[1] ?? String(c.points?.[1] ?? c.points?.[0] ?? min)
													const max = isCompleteSignedInteger(rawMax) ? Number(rawMax) : c.points?.[1] ?? min

													updateCriteria(i, (criteria) => ({
														...criteria,
														points: [Math.min(min, max), Math.max(min, max)],
													}))
												}}
											/>

											<Input
												placeholder={t.maxPlaceholder}
												type='text'
												value={criteriaDrafts[i]?.[1] ?? String(c.points?.[1] ?? c.points?.[0] ?? 0)}
												onChange={(e) => {
													const rawMax = e.target.value
													if (!isSignedIntegerDraft(rawMax)) return

													const currentDraft = criteriaDrafts[i] ?? [
														String(c.points?.[0] ?? 0),
														String(c.points?.[1] ?? c.points?.[0] ?? 0),
													]
													updateCriteriaDraft(i, [currentDraft[0] ?? String(c.points?.[0] ?? 0), rawMax])

													if (!isCompleteSignedInteger(rawMax)) return

													const max = Number(rawMax)
													const rawMin = currentDraft[0] ?? String(c.points?.[0] ?? 0)
													const min = isCompleteSignedInteger(rawMin) ? Number(rawMin) : c.points?.[0] ?? max

													updateCriteria(i, (criteria) => ({
														...criteria,
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
			</CardContent>
		</Card>
	)
}
