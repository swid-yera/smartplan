'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'

import { EditableHourCell, NumericInput } from '@components'
import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatAsDash, formatHours, getHoursStyle, normalizeTopicType } from '@helpers'
import { cn } from '@lib'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Checkbox,
	FormField,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	Textarea,
} from '@shadcn'
import { RupTypeEnum, TopicTypeEnum } from '@types'
import { ChevronDown, GripVertical, Plus } from 'lucide-react'
import {
	type ArrayPath,
	type FieldArray,
	type FieldValues,
	type Path,
	useFieldArray,
	useFormContext,
	useWatch,
} from 'react-hook-form'

import { GenerateConfirmButton } from '../generate-card'

type Topic = {
	name: string
	type: TopicTypeEnum
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

type Semester = { semester: number; totalHours: number }

type Discipline = {
	name: string
	semesters: Semester[]
	topics: Topic[]
}

type IProps = FieldValues & {
	type: string
	disciplines: Discipline[]
}

export type TopicsDisciplineGenerateOptions = {
	additionalMessage?: string
	includeCurrentContent: boolean
	preferredPracticalCount?: number
	preferredSnzCount?: number
	preferredCombinedCount?: number
}

type TopicTotals = {
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours: number
	srsHours: number
}

const EMPTY_TOTALS: TopicTotals = {
	totalHours: 0,
	theoryHours: 0,
	practiceHours: 0,
	individualHours: 0,
	srspHours: 0,
	srsHours: 0,
}

const newTopic: Topic = {
	name: '',
	type: TopicTypeEnum.PRACTICAL,
	theoryHours: 0,
	practiceHours: 0,
	individualHours: 0,
	srspHours: 0,
	srsHours: 0,
}

export function TopicsEdit<T extends IProps>({
	onGenerateDiscipline,
	generatingDisciplineIndex = null,
}: {
	onGenerateDiscipline?: (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => void
	isGeneratingAll?: boolean
	generatingDisciplineIndex?: number | null
}) {
	const form = useFormContext<T>()
	const rupType = useWatch({ control: form.control, name: 'type' as Path<T> }) ?? ''
	const { fields: disciplineFields } = useFieldArray({
		control: form.control,
		name: 'disciplines' as ArrayPath<T>,
		keyName: 'key',
	})

	return (
		<div className='space-y-16'>
			{disciplineFields.map((field, index) => (
				<DisciplineBlock
					key={field.key}
					disciplineIndex={index}
					generatingDisciplineIndex={generatingDisciplineIndex}
					rupType={rupType as RupTypeEnum | ''}
					onGenerateDiscipline={onGenerateDiscipline}
				/>
			))}
			<TopicsSummary />
		</div>
	)
}

function getTotalsFromTopics(topics: Topic[]): TopicTotals {
	return topics.reduce(
		(acc, t) => {
			acc.theoryHours += Number(t.theoryHours) || 0
			acc.practiceHours += Number(t.practiceHours) || 0
			acc.individualHours += Number(t.individualHours) || 0
			acc.srspHours += Number(t.srspHours) || 0
			acc.srsHours += Number(t.srsHours) || 0
			acc.totalHours +=
				(Number(t.theoryHours) || 0) + (Number(t.practiceHours) || 0) + (Number(t.individualHours) || 0)

			return acc
		},
		{ ...EMPTY_TOTALS },
	)
}

function TopicsSummary<T extends IProps>() {
	const form = useFormContext<T>()
	const disciplines = (useWatch({ control: form.control, name: 'disciplines' as Path<T> }) ?? []) as Discipline[]

	const total = useMemo(
		() => disciplines.reduce((acc, d) => mergeTotals(acc, getTotalsFromTopics(d.topics || [])), { ...EMPTY_TOTALS }),
		[disciplines],
	)
	const totalDeclaredHours = useMemo(
		() =>
			disciplines.reduce(
				(sum, d) => sum + (d.semesters?.reduce((acc, s) => acc + (Number(s.totalHours) || 0), 0) || 0),
				0,
			),
		[disciplines],
	)

	return (
		<div className='mt-10 rounded-xl border p-1'>
			<div className='px-4 py-2 font-semibold italic uppercase tracking-wider text-xs'>
				Сводная информация по всем дисциплинам
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='text-right font-medium text-muted-foreground' colSpan={2}>
							Категория
						</TableHead>
						<TableHead className='w-24 text-center font-bold text-foreground'>Всего</TableHead>
						<TableHead className='w-20 text-center text-xs'>Теор</TableHead>
						<TableHead className='w-20 text-center text-xs'>Прак</TableHead>
						<TableHead className='w-20 text-center text-xs'>Инд</TableHead>
						<TableHead className='w-20 text-center text-xs text-muted-foreground italic'>СРСП</TableHead>
						<TableHead className='w-20 text-center text-xs text-muted-foreground italic'>СРС</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow className='hover:bg-primary/5 transition-colors'>
						<TableCell className='text-right font-medium' colSpan={2}>
							Всего часов:
						</TableCell>
						<TableCell className='text-center'>
							<span
								className={cn(
									'inline-flex items-center justify-center rounded-md px-2 py-1 min-w-12 font-bold shadow-sm',
									total.totalHours !== totalDeclaredHours &&
										'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
								)}
							>
								{total.totalHours}
							</span>
						</TableCell>
						<TableCell className='text-center font-medium'>{total.theoryHours || 0}</TableCell>
						<TableCell className='text-center font-medium'>{total.practiceHours || 0}</TableCell>
						<TableCell className='text-center font-medium'>{total.individualHours || 0}</TableCell>
						<TableCell className='text-center text-muted-foreground italic'>{total.srspHours || 0}</TableCell>
						<TableCell className='text-center text-muted-foreground italic'>{total.srsHours || 0}</TableCell>
					</TableRow>
					<TableRow className='border-t border-dashed'>
						<TableCell className='text-right text-muted-foreground' colSpan={2}>
							Заявлено в учебном плане:
						</TableCell>
						<TableCell className='text-center font-bold text-lg text-foreground/70'>
							{totalDeclaredHours}
						</TableCell>
						<TableCell className='text-left py-0' colSpan={5}>
							{total.totalHours !== totalDeclaredHours && (
								<span className='text-sm font-medium text-destructive animate-pulse duration-1000'>
									← Несоответствие: {formatHours(Math.abs(totalDeclaredHours - total.totalHours))}
								</span>
							)}
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	)
}

function mergeTotals(base: TopicTotals, next: TopicTotals): TopicTotals {
	return {
		totalHours: base.totalHours + next.totalHours,
		theoryHours: base.theoryHours + next.theoryHours,
		practiceHours: base.practiceHours + next.practiceHours,
		individualHours: base.individualHours + next.individualHours,
		srspHours: base.srspHours + next.srspHours,
		srsHours: base.srsHours + next.srsHours,
	}
}

function DisciplineBlock<T extends IProps>({
	disciplineIndex,
	onGenerateDiscipline,
	generatingDisciplineIndex,
	rupType,
}: {
	disciplineIndex: number
	onGenerateDiscipline?: (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => void
	generatingDisciplineIndex: number | null
	rupType: RupTypeEnum | ''
}) {
	const form = useFormContext<T>()
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isSticky, setIsSticky] = useState(false)
	const [additionalMessage, setAdditionalMessage] = useState('')
	const [includeCurrentContent, setIncludeCurrentContent] = useState(true)
	const [preferredPracticalCount, setPreferredPracticalCount] = useState<number | ''>(0)
	const [preferredSnzCount, setPreferredSnzCount] = useState<number | ''>(0)
	const [preferredCombinedCount, setPreferredCombinedCount] = useState<number | ''>(0)
	const headerRef = useRef<HTMLDivElement | null>(null)
	const {
		fields: topicFields,
		append,
		move,
		remove,
	} = useFieldArray({
		control: form.control,
		name: `disciplines.${disciplineIndex}.topics` as ArrayPath<T>,
		keyName: 'key',
	})
	const [selectedTopicKeys, setSelectedTopicKeys] = useState<string[]>([])
	const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false)

	const disciplineName =
		(useWatch({
			control: form.control,
			name: `disciplines.${disciplineIndex}.name` as Path<T>,
		}) as string) ?? ''
	const disciplineTopics =
		(useWatch({
			control: form.control,
			name: `disciplines.${disciplineIndex}.topics` as Path<T>,
		}) as Topic[] | undefined) ?? []
	const disciplineSemesters =
		(useWatch({
			control: form.control,
			name: `disciplines.${disciplineIndex}.semesters` as Path<T>,
		}) as Semester[] | undefined) ?? []

	const sectionTotal = useMemo(() => getTotalsFromTopics(disciplineTopics), [disciplineTopics])
	const declaredForThisDiscipline = useMemo(
		() => disciplineSemesters.reduce((acc, s) => acc + (Number(s.totalHours) || 0), 0),
		[disciplineSemesters],
	)
	const hasError = sectionTotal.totalHours !== declaredForThisDiscipline
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor))
	const sortableItems = useMemo(() => topicFields.map((f) => f.key), [topicFields])
	const [stickyTopPx, setStickyTopPx] = useState(100)
	const isGeneratingCurrentDiscipline = generatingDisciplineIndex === disciplineIndex
	const isGenerateButtonDisabled = generatingDisciplineIndex !== null
	const isPracticeModule = rupType === RupTypeEnum.PRACTICE
	const hoursPerTopic = isPracticeModule ? 6 : 2
	const hasSelectedTopics = selectedTopicKeys.length > 0
	const isAllSelected = topicFields.length > 0 && selectedTopicKeys.length === topicFields.length
	const isIndeterminate = selectedTopicKeys.length > 0 && selectedTopicKeys.length < topicFields.length
	const selectedTopicCount = selectedTopicKeys.length

	const selectedTopicIndexes = useMemo(
		() =>
			topicFields
				.map((field, index) => ({ key: field.key, index }))
				.filter((item) => selectedTopicKeys.includes(item.key))
				.map((item) => item.index)
				.sort((a, b) => b - a),
		[selectedTopicKeys, topicFields],
	)

	const practicalCount = preferredPracticalCount === '' ? 0 : preferredPracticalCount
	const snzCount = preferredSnzCount === '' ? 0 : preferredSnzCount
	const combinedCount = preferredCombinedCount === '' ? 0 : preferredCombinedCount

	const practicalMax = Math.max(
		0,
		Math.floor(
			(declaredForThisDiscipline -
				combinedCount * hoursPerTopic -
				(isPracticeModule ? 0 : snzCount * hoursPerTopic)) /
				hoursPerTopic,
		),
	)
	const snzMax = Math.max(
		0,
		Math.floor(
			(declaredForThisDiscipline - practicalCount * hoursPerTopic - combinedCount * hoursPerTopic) / hoursPerTopic,
		),
	)
	const combinedMax = Math.max(
		0,
		Math.floor(
			(declaredForThisDiscipline -
				practicalCount * hoursPerTopic -
				(isPracticeModule ? 0 : snzCount * hoursPerTopic)) /
				hoursPerTopic,
		),
	)

	const practicalHoursTotal = practicalCount * hoursPerTopic
	const snzHoursTotal = snzCount * hoursPerTopic
	const combinedHoursTotal = combinedCount * hoursPerTopic

	const preferredHoursTotal = practicalHoursTotal + combinedHoursTotal + (isPracticeModule ? 0 : snzHoursTotal)
	const isPreferredHoursValid = preferredHoursTotal === declaredForThisDiscipline

	const toPositiveNumber = (value: number | '') => {
		if (value === '' || value <= 0) return undefined

		return value
	}

	const handleGenerateDiscipline = () => {
		if (!onGenerateDiscipline) return

		onGenerateDiscipline(disciplineIndex, {
			additionalMessage,
			includeCurrentContent,
			preferredCombinedCount: toPositiveNumber(preferredCombinedCount),
			preferredPracticalCount: toPositiveNumber(preferredPracticalCount),
			preferredSnzCount: isPracticeModule ? undefined : toPositiveNumber(preferredSnzCount),
		})
	}

	const toggleSelectTopic = (key: string, checked: boolean) => {
		setSelectedTopicKeys((prev) => {
			if (checked) {
				if (prev.includes(key)) return prev

				return [...prev, key]
			}

			return prev.filter((item) => item !== key)
		})
	}

	const toggleSelectAllTopics = (checked: boolean) => {
		if (checked) {
			setSelectedTopicKeys(topicFields.map((field) => field.key))

			return
		}

		setSelectedTopicKeys([])
	}

	const handleDeleteSelectedTopics = () => {
		if (selectedTopicIndexes.length === 0) return
		remove(selectedTopicIndexes)
		setSelectedTopicKeys([])
		setIsDeleteSelectedOpen(false)
	}

	useEffect(() => {
		const headerNode = headerRef.current

		if (!headerNode) return

		const tabPanel = headerNode.closest('[role="tabpanel"]')
		const fallbackOffset = 100
		let stickyTitle: HTMLElement | null = null

		const resolveStickyTitle = () =>
			(tabPanel?.querySelector('[data-rup-sticky-title="true"]') as HTMLElement | null) ??
			(document.querySelector('[data-rup-sticky-title="true"]') as HTMLElement | null)

		const updateStickyOffset = () => {
			stickyTitle = resolveStickyTitle()
			const nextOffset = stickyTitle ? Math.ceil(stickyTitle.getBoundingClientRect().height) : fallbackOffset

			setStickyTopPx((prev) => (prev === nextOffset ? prev : nextOffset))
		}

		updateStickyOffset()
		window.requestAnimationFrame(updateStickyOffset)

		const observer = new ResizeObserver(updateStickyOffset)
		const tabPanelObserver = tabPanel ? new MutationObserver(updateStickyOffset) : null

		if (stickyTitle) {
			observer.observe(stickyTitle)
		}
		if (tabPanel) {
			tabPanelObserver?.observe(tabPanel, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ['class', 'style', 'data-state'],
			})
		}
		window.addEventListener('resize', updateStickyOffset)

		return () => {
			observer.disconnect()
			tabPanelObserver?.disconnect()
			window.removeEventListener('resize', updateStickyOffset)
		}
	}, [])

	useEffect(() => {
		const node = headerRef.current

		if (!node) return

		let frame = 0

		const onScroll = () => {
			if (frame) return
			frame = window.requestAnimationFrame(() => {
				frame = 0
				setIsSticky(node.getBoundingClientRect().top <= stickyTopPx)
			})
		}

		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })

		return () => {
			if (frame) window.cancelAnimationFrame(frame)
			window.removeEventListener('scroll', onScroll)
		}
	}, [stickyTopPx])

	useEffect(() => {
		setSelectedTopicKeys((prev) => prev.filter((key) => topicFields.some((field) => field.key === key)))
	}, [topicFields])

	useEffect(() => {
		if (preferredPracticalCount !== '' && preferredPracticalCount > practicalMax) {
			setPreferredPracticalCount(practicalMax)
		}

		if (!isPracticeModule && preferredSnzCount !== '' && preferredSnzCount > snzMax) {
			setPreferredSnzCount(snzMax)
		}

		if (preferredCombinedCount !== '' && preferredCombinedCount > combinedMax) {
			setPreferredCombinedCount(combinedMax)
		}
	}, [
		combinedMax,
		isPracticeModule,
		practicalMax,
		preferredCombinedCount,
		preferredPracticalCount,
		preferredSnzCount,
		snzMax,
	])

	return (
		<div className='border rounded-lg'>
			{/* header */}
			<div
				ref={headerRef}
				className={cn(
					'flex items-center p-3 bg-muted/50 sticky z-20 border-b backdrop-blur-sm supports-backdrop-filter:bg-muted/50',
					isSticky ? 'rounded-t-none' : 'rounded-t-lg',
				)}
				style={{ top: `${stickyTopPx}px` }}
			>
				<div className='ml-2 flex-1 font-medium'>{disciplineName}</div>
				<div className='flex gap-2'>
					{hasSelectedTopics && (
						<Button size='sm' type='button' variant='destructive' onClick={() => setIsDeleteSelectedOpen(true)}>
							Удалить выбранные ({selectedTopicCount})
						</Button>
					)}
					<Button
						size='sm'
						type='button'
						variant='outline'
						onClick={() => {
							append(newTopic as FieldArray<T, ArrayPath<T>>)
							setIsCollapsed(false)
						}}
					>
						<Plus className='h-4 w-4 mr-1' /> Добавить тему
					</Button>
					<Button size='sm' type='button' variant='ghost' onClick={() => setIsCollapsed((prev) => !prev)}>
						<ChevronDown className={cn('transition-transform', isCollapsed && '-rotate-90')} />
					</Button>
				</div>
			</div>

			{!isCollapsed && (
				<div className='min-h-0 overflow-hidden'>
					<DndContext
						collisionDetection={closestCenter}
						modifiers={[restrictToVerticalAxis]}
						sensors={sensors}
						onDragEnd={(e) => {
							const { active, over } = e

							if (active && over && active.id !== over.id) {
								const oldIndex = topicFields.findIndex((f) => f.key === active.id)
								const newIndex = topicFields.findIndex((f) => f.key === over.id)

								if (oldIndex >= 0 && newIndex >= 0) {
									move(oldIndex, newIndex)
								}
							}
						}}
					>
						<Table>
							<TableHeader>
								<TableRow className='bg-muted/20'>
									<TableHead className='w-12 bg-muted/20 text-center'>
										<Checkbox
											checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
											onCheckedChange={(checked) => toggleSelectAllTopics(checked === true)}
										/>
									</TableHead>
									<TableHead className='w-12 bg-muted/20 text-center'>№</TableHead>
									<TableHead className='min-w-[450px] w-full bg-muted/20'>Темы занятий</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Всего</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Теор</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Прак</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Инд</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center text-xs'>СРСП</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center text-xs'>СРС</TableHead>
									<TableHead className='min-w-48 bg-muted/20'>Тип</TableHead>
								</TableRow>
							</TableHeader>
							<SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
								<TableBody>
									{topicFields.length > 0 ? (
										topicFields.map((field, index) => (
											<TopicRow
												key={field.key}
												disciplineIndex={disciplineIndex}
												id={field.key}
												isSelected={selectedTopicKeys.includes(field.key)}
												rupType={rupType}
												toggleSelectTopic={toggleSelectTopic}
												topicIndex={index}
											/>
										))
									) : (
										<TableRow>
											<TableCell className='h-56 text-center text-muted-foreground' colSpan={10}>
												Критерии оценки и/или темы занятий не добавлены.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</SortableContext>
							<TableFooter>
								<TableRow className={cn('bg-muted/5', hasError && 'bg-destructive/10 hover:bg-destructive/20')}>
									<TableCell
										className={cn('py-5 text-right font-bold', hasError && 'text-destructive')}
										colSpan={2}
									>
										Всего часов:
									</TableCell>
									<TableCell className='text-center font-bold'>
										{formatAsDash(sectionTotal.totalHours)}
									</TableCell>
									<TableCell className='text-center'>{formatAsDash(sectionTotal.theoryHours)}</TableCell>
									<TableCell className='text-center'>{formatAsDash(sectionTotal.practiceHours)}</TableCell>
									<TableCell className='text-center'>{formatAsDash(sectionTotal.individualHours)}</TableCell>
									<TableCell className='text-center'>{formatAsDash(sectionTotal.srspHours)}</TableCell>
									<TableCell className='text-center'>{formatAsDash(sectionTotal.srsHours)}</TableCell>
									<TableCell
										className={cn('text-right font-medium', hasError && 'text-destructive font-bold')}
									>
										Заявлено: {formatHours(declaredForThisDiscipline)}
									</TableCell>
									<TableCell className='text-right'>
										<GenerateConfirmButton
											buttonText={isGeneratingCurrentDiscipline ? 'Генерация…' : 'Сгенерировать'}
											confirmButtonText='Сгенерировать'
											confirmContent={
												<div className='grid gap-4'>
													<div className='flex flex-col gap-2'>
														<Label htmlFor={`discipline-${disciplineIndex}-additional-message`}>
															Дополнительное сообщение
														</Label>
														<Textarea
															id={`discipline-${disciplineIndex}-additional-message`}
															placeholder='Уточните, что нужно учесть при генерации'
															rows={4}
															value={additionalMessage}
															onChange={(event) => setAdditionalMessage(event.target.value)}
														/>
													</div>

													<div
														className={cn('grid gap-2', isPracticeModule ? 'grid-cols-2' : 'grid-cols-3')}
													>
														<div className='flex flex-col gap-2'>
															<Label htmlFor={`discipline-${disciplineIndex}-practical-count`}>
																практических
															</Label>
															<NumericInput
																id={`discipline-${disciplineIndex}-practical-count`}
																max={practicalMax}
																min={0}
																placeholder='например 8'
																value={preferredPracticalCount}
																onChange={(value) => setPreferredPracticalCount(value)}
															/>
															<p className='text-xs text-muted-foreground'>
																Тем: {practicalCount} × {hoursPerTopic}ч = {practicalHoursTotal}ч
															</p>
														</div>
														{!isPracticeModule && (
															<div className='flex flex-col gap-2'>
																<Label htmlFor={`discipline-${disciplineIndex}-snz-count`}>СНЗ</Label>
																<NumericInput
																	id={`discipline-${disciplineIndex}-snz-count`}
																	max={snzMax}
																	min={0}
																	placeholder='например 2'
																	value={preferredSnzCount}
																	onChange={(value) => setPreferredSnzCount(value)}
																/>
																<p className='text-xs text-muted-foreground'>
																	Тем: {snzCount} × {hoursPerTopic}ч = {snzHoursTotal}ч
																</p>
															</div>
														)}
														<div className='flex flex-col gap-2'>
															<Label htmlFor={`discipline-${disciplineIndex}-combined-count`}>
																комбинированных
															</Label>
															<NumericInput
																id={`discipline-${disciplineIndex}-combined-count`}
																max={combinedMax}
																min={0}
																placeholder='например 4'
																value={preferredCombinedCount}
																onChange={(value) => setPreferredCombinedCount(value)}
															/>
															<p className='text-xs text-muted-foreground'>
																Тем: {combinedCount} × {hoursPerTopic}ч = {combinedHoursTotal}ч
															</p>
														</div>
													</div>

													<div className='flex items-center gap-2'>
														<Checkbox
															checked={includeCurrentContent}
															id={`discipline-${disciplineIndex}-include-current-content`}
															onCheckedChange={(checked) => setIncludeCurrentContent(checked === true)}
														/>
														<Label htmlFor={`discipline-${disciplineIndex}-include-current-content`}>
															Включить текущий написанный контент
														</Label>
													</div>
													<div className='space-y-1 text-sm'>
														<p className='text-muted-foreground'>
															Заявлено часов:{' '}
															<span className='font-medium text-foreground'>
																{declaredForThisDiscipline}
															</span>
														</p>
														<p className='text-muted-foreground'>
															По выбранным темам:{' '}
															<span className='font-medium text-foreground'>{preferredHoursTotal}</span>
														</p>
														{!isPreferredHoursValid && (
															<p className='text-destructive'>
																Ошибка: сумма часов по выбранным темам должна быть равна заявленным
																часам.
															</p>
														)}
													</div>
												</div>
											}
											confirmDescription='Будут сгенерированы темы только для текущей дисциплины. Текущие темы дисциплины будут перезаписаны.'
											confirmDisabled={!isPreferredHoursValid}
											confirmTitle='Сгенерировать темы для дисциплины?'
											disabled={isGenerateButtonDisabled}
											disabledReason='Дождитесь завершения текущей генерации'
											triggerClassName='h-8'
											triggerSize='sm'
											onClick={handleGenerateDiscipline}
										/>
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</DndContext>
				</div>
			)}

			<AlertDialog open={isDeleteSelectedOpen} onOpenChange={setIsDeleteSelectedOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить выбранные темы?</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Отмена</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteSelectedTopics}>Удалить</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

// topic row
interface ITopicRowProps {
	id: string
	disciplineIndex: number
	topicIndex: number
	rupType: RupTypeEnum | ''
	isSelected: boolean
	toggleSelectTopic: (key: string, checked: boolean) => void
}

const TopicRowComponent = ({
	id,
	disciplineIndex,
	topicIndex,
	rupType,
	isSelected,
	toggleSelectTopic,
}: ITopicRowProps) => {
	const form = useFormContext()
	const topicPath = `disciplines.${disciplineIndex}.topics.${topicIndex}`
	const topic = useWatch({ control: form.control, name: topicPath }) as Topic
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

	// filter topic type depend from rup type
	const availableTopicTypes = useMemo(() => {
		const allTypes = Object.values(TopicTypeEnum)

		if (rupType === RupTypeEnum.PRACTICE) {
			// remove SNZ if practice module
			return allTypes.filter((type) => type !== TopicTypeEnum.SNZ)
		}

		return allTypes
	}, [rupType])

	// logic for automatic distribution of hours when changing the rup type
	useEffect(() => {
		if (!topic?.type || !rupType) return

		const hours = rupType === RupTypeEnum.PRACTICE ? 6 : 2

		// snz
		const snzPracticalHours = rupType === RupTypeEnum.PRACTICE && topic.type === TopicTypeEnum.SNZ ? 6 : 0
		const snzIndividualHours = rupType === RupTypeEnum.PRACTICE && topic.type === TopicTypeEnum.SNZ ? 0 : 2
		const snzType =
			rupType === RupTypeEnum.PRACTICE && topic.type === TopicTypeEnum.SNZ
				? TopicTypeEnum.PRACTICAL
				: TopicTypeEnum.SNZ

		const mapHours: Record<string, Partial<Topic>> = {
			[TopicTypeEnum.SNZ]: {
				theoryHours: 0,
				practiceHours: snzPracticalHours,
				individualHours: snzIndividualHours,
				type: snzType,
			},
			[TopicTypeEnum.COMBINED]: { theoryHours: hours, practiceHours: 0, individualHours: 0 },
			[TopicTypeEnum.PRACTICAL]: { theoryHours: 0, practiceHours: hours, individualHours: 0 },
		}

		const updatesHours = mapHours[topic.type]

		if (updatesHours) {
			Object.entries(updatesHours).forEach(([key, val]) => {
				const path = `disciplines.${disciplineIndex}.topics.${topicIndex}.${key}`

				if (form.getValues(path) !== val) {
					form.setValue(path, val)
				}
			})
		}
	}, [disciplineIndex, form, rupType, topic?.type, topicIndex])

	const currentTotal =
		(Number(topic?.theoryHours) || 0) + (Number(topic?.practiceHours) || 0) + (Number(topic?.individualHours) || 0)

	return (
		<TableRow
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
		>
			<TableCell className='text-center'>
				<Checkbox checked={isSelected} onCheckedChange={(checked) => toggleSelectTopic(id, checked === true)} />
			</TableCell>
			<TableCell className='text-center'>
				<div className='flex items-center gap-2'>
					<button {...listeners} {...attributes} type='button'>
						<GripVertical className='h-4 w-4 text-muted-foreground' />
					</button>
					{topicIndex + 1}
				</div>
			</TableCell>
			<TableCell>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.name`}
					render={({ field }) => <Input className='h-8' placeholder='Тема...' {...field} />}
				/>
			</TableCell>
			<TableCell className={cn(getHoursStyle(currentTotal), 'font-semibold')}>
				{formatAsDash(currentTotal)}
			</TableCell>
			<TableCell className={getHoursStyle(topic?.theoryHours)}>{formatAsDash(topic?.theoryHours)}</TableCell>
			<TableCell className={getHoursStyle(topic?.practiceHours)}>{formatAsDash(topic?.practiceHours)}</TableCell>
			<TableCell className={getHoursStyle(topic?.individualHours)}>{formatAsDash(topic?.individualHours)}</TableCell>
			<EditableHourCell fieldName={`disciplines.${disciplineIndex}.topics.${topicIndex}.srspHours`} form={form} />
			<EditableHourCell fieldName={`disciplines.${disciplineIndex}.topics.${topicIndex}.srsHours`} form={form} />
			<TableCell>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.type`}
					render={({ field }) => (
						<Select value={field.value} onValueChange={field.onChange}>
							<SelectTrigger className='h-8 w-full'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availableTopicTypes.map((type) => (
									<SelectItem key={type} value={type}>
										{normalizeTopicType(type)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				/>
			</TableCell>
		</TableRow>
	)
}

const TopicRow = memo(
	TopicRowComponent,
	(prev, next) =>
		prev.id === next.id &&
		prev.disciplineIndex === next.disciplineIndex &&
		prev.topicIndex === next.topicIndex &&
		prev.rupType === next.rupType &&
		prev.isSelected === next.isSelected &&
		prev.toggleSelectTopic === next.toggleSelectTopic,
)
