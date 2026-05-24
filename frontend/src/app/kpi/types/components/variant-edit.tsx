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
import type { Locale } from '@types'
import { CriteriaMethodEnum } from '@types'
import { Plus, Trash } from 'lucide-react'

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

	return (
		<Card className='relative'>
			<CardHeader className='pb-2'>
				<div className='flex items-start justify-between'>
					<CardTitle className='text-base'>Вариант {index + 1}</CardTitle>

					<Button size='icon' variant='ghost' onClick={onDelete}>
						<Trash className='h-4 w-4 text-muted-foreground' />
					</Button>
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				<Input
					placeholder='Название варианта'
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
					placeholder='Описание'
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
						<p className='text-sm font-medium'>Критерии</p>
						<Button size='sm' variant='outline' onClick={addCriteria}>
							<Plus className='mr-2 h-3 w-3' />
							Критерий
						</Button>
					</div>

					<ol className='list-[lower-roman] space-y-8 pl-5'>
						{variant.criteria.map((c, i) => (
							<li key={i} className='space-y-3'>
								<Input
									placeholder='Название критерия'
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

								<div className='flex gap-3'>
									{/* method */}
									<Select
										value={c.method}
										onValueChange={(value: CriteriaMethodEnum) => {
											const next = [...variant.criteria]

											next[i] = {
												...c,
												method: value,
												points:
													value === CriteriaMethodEnum.NORMAL
														? [c.points?.[0] ?? 0]
														: [c.points?.[0] ?? 0, c.points?.[1] ?? 0],
											}

											onChange({ ...variant, criteria: next })
										}}
									>
										<SelectTrigger className='w-48'>
											<SelectValue placeholder='Метод' />
										</SelectTrigger>

										<SelectContent>
											<SelectItem value={CriteriaMethodEnum.NORMAL}>Фиксированный</SelectItem>
											<SelectItem value={CriteriaMethodEnum.MEASURING}>Диапазон</SelectItem>
										</SelectContent>
									</Select>

									{/* points */}
									{c.method === CriteriaMethodEnum.NORMAL ? (
										<Input
											min={0}
											placeholder='Баллы'
											type='number'
											value={c.points?.[0] ?? 0}
											onChange={(e) => {
												const value = Math.max(0, Number(e.target.value))

												const next = [...variant.criteria]

												next[i] = {
													...c,
													points: [value],
												}

												onChange({ ...variant, criteria: next })
											}}
										/>
									) : (
										<div className='flex gap-2'>
											<Input
												min={0}
												placeholder='Мин'
												type='number'
												value={c.points?.[0] ?? 0}
												onChange={(e) => {
													const min = Math.max(0, Number(e.target.value))
													const max = c.points?.[1] ?? min

													const next = [...variant.criteria]

													next[i] = {
														...c,
														points: [min, Math.max(min, max)],
													}

													onChange({ ...variant, criteria: next })
												}}
											/>

											<Input
												min={0}
												placeholder='Макс'
												type='number'
												value={c.points?.[1] ?? 0}
												onChange={(e) => {
													const max = Math.max(0, Number(e.target.value))
													const min = c.points?.[0] ?? 0

													const next = [...variant.criteria]

													next[i] = {
														...c,
														points: [Math.min(min, max), max],
													}

													onChange({ ...variant, criteria: next })
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
