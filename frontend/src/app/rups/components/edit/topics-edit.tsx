'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import {
	formatAsDash,
	formatHours,
	getHoursStyle,
	getLocaleText,
	getTopicDurationHours,
	getTopicHoursByType,
	getUILocaleSection,
	normalizeTopicType,
	topicTypeIconColorClasses,
	topicTypeIcons,
} from '@helpers'
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
import { useLocaleStore } from '@store'
import { type Locale, type LocaleText, TopicTypeEnum } from '@types'
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

import { getLocalizedValue, updateLocaleText } from '../../rup-localization'
import { GenerateConfirmButton } from '../generate-card'
import localeDictionary from './locale.json'

type Topic = {
	name: LocaleText
	type: TopicTypeEnum
	durationHours?: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

type Semester = { semester: number; totalHours: number }

type Discipline = {
	name: LocaleText
	semesters: Semester[]
	topics: Topic[]
}

type IProps = FieldValues & {
	disciplines: Discipline[]
}

export type TopicsDisciplineGenerateOptions = {
	additionalMessage?: string
	includeCurrentContent: boolean
	preferredPracticalCount?: number
	preferredSnzCount?: number
	preferredCombinedCount?: number
	preferredSrspCount?: number
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
	name: { ru: '', kz: '' },
	type: TopicTypeEnum.PRACTICAL,
	durationHours: 2,
	theoryHours: 0,
	practiceHours: 0,
	individualHours: 0,
	srspHours: 0,
	srsHours: 0,
}

export function TopicsEdit<T extends IProps>({
	activeLocale,
	onGenerateDiscipline,
	generatingDisciplineIndex = null,
}: {
	activeLocale: Locale
	onGenerateDiscipline?: (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => void
	isGeneratingAll?: boolean
	generatingDisciplineIndex?: number | null
}) {
	const form = useFormContext<T>()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { fields: disciplineFields } = useFieldArray({
		control: form.control,
		name: 'disciplines' as ArrayPath<T>,
		keyName: 'key',
	})

	return (
		<div className='space-y-16'>
			{disciplineFields.map((field, index) => (
				<DisciplineBlock
					activeLocale={activeLocale}
					key={field.key}
					disciplineIndex={index}
					generatingDisciplineIndex={generatingDisciplineIndex}
					text={t.topics}
					onGenerateDiscipline={onGenerateDiscipline}
				/>
			))}
			<TopicsSummary text={t.topics} />
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
				(Number(t.theoryHours) || 0) +
				(Number(t.practiceHours) || 0) +
				(Number(t.individualHours) || 0) +
				(Number(t.srspHours) || 0)

			return acc
		},
		{ ...EMPTY_TOTALS },
	)
}

function TopicsSummary<T extends IProps>({
	text,
}: {
	text: {
		summaryTitle: string
		category: string
		total: string
		theory: string
		practice: string
		individual: string
		srsp: string
		srs: string
		totalHours: string
		declaredPlan: string
		mismatch: string
	}
}) {
	const form = useFormContext<T>()
	const disciplines = (useWatch({ control: form.control, name: 'disciplines' as Path<T> }) ?? []) as Discipline[]

	const total = useMemo(
		() => disciplines.reduce((acc, d) => mergeTotals(acc, getTotalsFromTopics(d.topics || [])), { ...EMPTY_TOTALS }),
		[disciplines],
	)
	const totalDeclaredHours = useMemo(
		() =>
			disciplines.reduce((sum, d) => {
				const semesterHours = d.semesters?.reduce((acc, s) => acc + (Number(s.totalHours) || 0), 0) || 0
				const srspHours = d.topics?.reduce((acc, topic) => acc + (Number(topic.srspHours) || 0), 0) || 0

				return sum + semesterHours + srspHours
			}, 0),
		[disciplines],
	)

	return (
		<div className='mt-10 rounded-xl border p-1'>
			<div className='px-4 py-2 font-semibold italic uppercase tracking-wider text-xs'>{text.summaryTitle}</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='text-right font-medium text-muted-foreground' colSpan={2}>
							{text.category}
						</TableHead>
						<TableHead className='w-24 text-center font-bold text-foreground'>{text.total}</TableHead>
						<TableHead className='w-20 text-center text-xs'>{text.theory}</TableHead>
						<TableHead className='w-20 text-center text-xs'>{text.practice}</TableHead>
						<TableHead className='w-20 text-center text-xs'>{text.individual}</TableHead>
						<TableHead className='w-20 text-center text-xs text-muted-foreground italic'>{text.srsp}</TableHead>
						<TableHead className='w-20 text-center text-xs text-muted-foreground italic'>{text.srs}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow className='hover:bg-primary/5 transition-colors'>
						<TableCell className='text-right font-medium' colSpan={2}>
							{text.totalHours}:
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
							{text.declaredPlan}:
						</TableCell>
						<TableCell className='text-center font-bold text-lg text-foreground/70'>
							{totalDeclaredHours}
						</TableCell>
						<TableCell className='text-left py-0' colSpan={5}>
							{total.totalHours !== totalDeclaredHours && (
								<span className='text-sm font-medium text-destructive animate-pulse duration-1000'>
									← {text.mismatch}: {formatHours(Math.abs(totalDeclaredHours - total.totalHours))}
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
	activeLocale,
	disciplineIndex,
	onGenerateDiscipline,
	generatingDisciplineIndex,
	text,
}: {
	activeLocale: Locale
	disciplineIndex: number
	onGenerateDiscipline?: (disciplineIndex: number, options: TopicsDisciplineGenerateOptions) => void
	generatingDisciplineIndex: number | null
	text: {
		deleteSelected: string
		addTopic: string
		tableTopicTitle: string
		total: string
		theory: string
		practice: string
		individual: string
		srsp: string
		srs: string
		tableType: string
		durationHours: string
		empty: string
		totalHours: string
		declared: string
		generateButton: string
		generatingButton: string
		additionalMessage: string
		additionalPlaceholder: string
		practical: string
		snz: string
		combined: string
		srspTopic: string
		example: string
		topicsCount: string
		hourUnit: string
		includeCurrent: string
		declaredHours: string
		selectedHours: string
		hoursValidation: string
		generateConfirmDescription: string
		generateConfirmTitle: string
		generateDisabledReason: string
		deleteSelectedTitle: string
		cancel: string
		delete: string
		topicPlaceholder: string
	}
}) {
	const form = useFormContext<T>()
	const locale = useLocaleStore((state) => state.locale)
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isSticky, setIsSticky] = useState(false)
	const [additionalMessage, setAdditionalMessage] = useState('')
	const [includeCurrentContent, setIncludeCurrentContent] = useState(true)
	const [preferredPracticalCount, setPreferredPracticalCount] = useState<number | ''>(0)
	const [preferredSnzCount, setPreferredSnzCount] = useState<number | ''>(0)
	const [preferredCombinedCount, setPreferredCombinedCount] = useState<number | ''>(0)
	const [preferredSrspCount, setPreferredSrspCount] = useState<number | ''>(0)
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

	const disciplineName = (useWatch({
		control: form.control,
		name: `disciplines.${disciplineIndex}.name` as Path<T>,
	}) as LocaleText | undefined) ?? { ru: '', kz: '' }
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
	const baseDeclaredHours = useMemo(
		() => disciplineSemesters.reduce((acc, s) => acc + (Number(s.totalHours) || 0), 0),
		[disciplineSemesters],
	)
	const declaredForThisDiscipline = useMemo(
		() => baseDeclaredHours + sectionTotal.srspHours,
		[baseDeclaredHours, sectionTotal.srspHours],
	)
	const hasError = sectionTotal.totalHours !== declaredForThisDiscipline
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor))
	const sortableItems = useMemo(() => topicFields.map((f) => f.key), [topicFields])
	const [stickyTopPx, setStickyTopPx] = useState(100)
	const isGeneratingCurrentDiscipline = generatingDisciplineIndex === disciplineIndex
	const isGenerateButtonDisabled = generatingDisciplineIndex !== null
	const hoursPerTopic = 2
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
	const srspCount = preferredSrspCount === '' ? 0 : preferredSrspCount

	const practicalMax = Math.max(0, Math.floor(baseDeclaredHours / hoursPerTopic))
	const snzMax = Math.max(0, Math.floor(baseDeclaredHours / hoursPerTopic))
	const combinedMax = Math.max(0, Math.floor(baseDeclaredHours / hoursPerTopic))
	const srspMax = Math.max(0, Math.floor(baseDeclaredHours / hoursPerTopic))

	const practicalHoursTotal = practicalCount * hoursPerTopic
	const snzHoursTotal = snzCount * hoursPerTopic
	const combinedHoursTotal = combinedCount * hoursPerTopic
	const srspHoursTotal = srspCount * hoursPerTopic

	const preferredHoursTotal = practicalHoursTotal + combinedHoursTotal + snzHoursTotal + srspHoursTotal
	const declaredHoursForGeneration = baseDeclaredHours + srspHoursTotal
	const isPreferredHoursValid = preferredHoursTotal === declaredHoursForGeneration

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
			preferredSnzCount: toPositiveNumber(preferredSnzCount),
			preferredSrspCount: toPositiveNumber(preferredSrspCount),
		})
	}

	const toggleSelectTopic = useCallback((key: string, checked: boolean) => {
		setSelectedTopicKeys((prev) => {
			if (checked) {
				if (prev.includes(key)) return prev

				return [...prev, key]
			}

			return prev.filter((item) => item !== key)
		})
	}, [])

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

		if (preferredSnzCount !== '' && preferredSnzCount > snzMax) {
			setPreferredSnzCount(snzMax)
		}

		if (preferredCombinedCount !== '' && preferredCombinedCount > combinedMax) {
			setPreferredCombinedCount(combinedMax)
		}

		if (preferredSrspCount !== '' && preferredSrspCount > srspMax) {
			setPreferredSrspCount(srspMax)
		}
	}, [
		baseDeclaredHours,
		combinedMax,
		practicalMax,
		preferredCombinedCount,
		preferredPracticalCount,
		preferredSrspCount,
		preferredSnzCount,
		srspMax,
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
				<div className='ml-2 flex-1 font-medium'>{getLocaleText(disciplineName, activeLocale)}</div>
				<div className='flex gap-2'>
					{hasSelectedTopics && (
						<Button size='sm' type='button' variant='destructive' onClick={() => setIsDeleteSelectedOpen(true)}>
							{text.deleteSelected} ({selectedTopicCount})
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
						<Plus className='h-4 w-4 mr-1' /> {text.addTopic}
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
									<TableHead className='min-w-[450px] w-full bg-muted/20'>{text.tableTopicTitle}</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>{text.total}</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>{text.theory}</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>{text.practice}</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>{text.individual}</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center text-xs'>{text.srsp}</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center text-xs'>{text.srs}</TableHead>
									<TableHead className='min-w-48 bg-muted/20'>{text.tableType}</TableHead>
								</TableRow>
							</TableHeader>
							<SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
								<TableBody>
									{topicFields.length > 0 ? (
										topicFields.map((field, index) => (
											<TopicRow
												activeLocale={activeLocale}
												key={field.key}
												disciplineIndex={disciplineIndex}
												id={field.key}
												isSelected={selectedTopicKeys.includes(field.key)}
												text={text}
												toggleSelectTopic={toggleSelectTopic}
												topicIndex={index}
											/>
										))
									) : (
										<TableRow>
											<TableCell className='h-56 text-center text-muted-foreground' colSpan={11}>
												{text.empty}
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
										{text.totalHours}:
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
										{text.declared}: {formatHours(declaredForThisDiscipline)}
									</TableCell>
									<TableCell className='text-right'>
										<GenerateConfirmButton
											buttonText={
												isGeneratingCurrentDiscipline ? text.generatingButton : text.generateButton
											}
											confirmButtonText={text.generateButton}
											confirmContent={
												<div className='grid gap-4'>
													<div className='flex flex-col gap-2'>
														<Label htmlFor={`discipline-${disciplineIndex}-additional-message`}>
															{text.additionalMessage}
														</Label>
														<Textarea
															id={`discipline-${disciplineIndex}-additional-message`}
															placeholder={text.additionalPlaceholder}
															rows={4}
															value={additionalMessage}
															onChange={(event) => setAdditionalMessage(event.target.value)}
														/>
													</div>

													<div className='grid grid-cols-4 gap-2'>
														<div className='flex flex-col gap-2'>
															<Label htmlFor={`discipline-${disciplineIndex}-practical-count`}>
																{text.practical}
															</Label>
															<NumericInput
																id={`discipline-${disciplineIndex}-practical-count`}
																max={practicalMax}
																min={0}
																placeholder={`${text.example} 8`}
																value={preferredPracticalCount}
																onChange={(value) => setPreferredPracticalCount(value)}
															/>
															<p className='text-xs text-muted-foreground'>
																{text.topicsCount}: {practicalCount} × {hoursPerTopic}
																{text.hourUnit} = {practicalHoursTotal}
																{text.hourUnit}
															</p>
														</div>
														<div className='flex flex-col gap-2'>
															<Label htmlFor={`discipline-${disciplineIndex}-snz-count`}>
																{text.snz}
															</Label>
															<NumericInput
																id={`discipline-${disciplineIndex}-snz-count`}
																max={snzMax}
																min={0}
																placeholder={`${text.example} 2`}
																value={preferredSnzCount}
																onChange={(value) => setPreferredSnzCount(value)}
															/>
															<p className='text-xs text-muted-foreground'>
																{text.topicsCount}: {snzCount} × {hoursPerTopic}
																{text.hourUnit} = {snzHoursTotal}
																{text.hourUnit}
															</p>
														</div>
														<div className='flex flex-col gap-2'>
															<Label htmlFor={`discipline-${disciplineIndex}-combined-count`}>
																{text.combined}
															</Label>
															<NumericInput
																id={`discipline-${disciplineIndex}-combined-count`}
																max={combinedMax}
																min={0}
																placeholder={`${text.example} 4`}
																value={preferredCombinedCount}
																onChange={(value) => setPreferredCombinedCount(value)}
															/>
															<p className='text-xs text-muted-foreground'>
																{text.topicsCount}: {combinedCount} × {hoursPerTopic}
																{text.hourUnit} = {combinedHoursTotal}
																{text.hourUnit}
															</p>
														</div>
														<div className='flex flex-col gap-2'>
															<Label htmlFor={`discipline-${disciplineIndex}-srsp-count`}>
																{text.srspTopic}
															</Label>
															<NumericInput
																id={`discipline-${disciplineIndex}-srsp-count`}
																max={srspMax}
																min={0}
																placeholder={`${text.example} 1`}
																value={preferredSrspCount}
																onChange={(value) => setPreferredSrspCount(value)}
															/>
															<p className='text-xs text-muted-foreground'>
																{text.topicsCount}: {srspCount} × {hoursPerTopic}
																{text.hourUnit} = {srspHoursTotal}
																{text.hourUnit}
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
															{text.includeCurrent}
														</Label>
													</div>
													<div className='space-y-1 text-sm'>
														<p className='text-muted-foreground'>
															{text.declaredHours}:{' '}
															<span className='font-medium text-foreground'>
																{declaredHoursForGeneration}
															</span>
														</p>
														<p className='text-muted-foreground'>
															{text.selectedHours}:{' '}
															<span className='font-medium text-foreground'>{preferredHoursTotal}</span>
														</p>
														{!isPreferredHoursValid && (
															<p className='text-destructive'>{text.hoursValidation}</p>
														)}
													</div>
												</div>
											}
											confirmDescription={text.generateConfirmDescription}
											confirmDisabled={!isPreferredHoursValid}
											confirmTitle={text.generateConfirmTitle}
											disabled={isGenerateButtonDisabled}
											disabledReason={text.generateDisabledReason}
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
						<AlertDialogTitle>{text.deleteSelectedTitle}</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{text.cancel}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteSelectedTopics}>{text.delete}</AlertDialogAction>
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
	activeLocale: Locale
	isSelected: boolean
	text: { topicPlaceholder: string }
	toggleSelectTopic: (key: string, checked: boolean) => void
}

const TopicRowComponent = <T extends IProps>({
	id,
	disciplineIndex,
	topicIndex,
	activeLocale,
	isSelected,
	text,
	toggleSelectTopic,
}: ITopicRowProps) => {
	const form = useFormContext<T>()
	const topicPath = `disciplines.${disciplineIndex}.topics.${topicIndex}`
	const topic = useWatch({ control: form.control, name: topicPath as Path<T> }) as unknown as Topic | undefined
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
	const [isEditingName, setIsEditingName] = useState(false)
	const [draftName, setDraftName] = useState('')
	const nameInputRef = useRef<HTMLInputElement | null>(null)
	const skipNameCommitRef = useRef(false)

	const currentTopic = topic ?? newTopic
	const normalizedDurationHours = getTopicDurationHours(currentTopic)

	const applyTopicHours = useCallback(
		(nextType: TopicTypeEnum, nextDurationHours?: number) => {
			const resolvedDurationHours = nextType === TopicTypeEnum.PRACTICAL && nextDurationHours === 6 ? 6 : 2
			const nextHours = getTopicHoursByType(nextType, resolvedDurationHours)
			const nextValues = {
				type: nextType,
				durationHours: resolvedDurationHours,
				theoryHours: nextHours.theoryHours,
				practiceHours: nextHours.practiceHours,
				individualHours: nextHours.individualHours,
				srspHours: nextHours.srspHours,
			}

			Object.entries(nextValues).forEach(([key, value]) => {
				const path = `${topicPath}.${key}` as Path<T>

				if (form.getValues(path) !== value) {
					form.setValue(path, value as never, { shouldDirty: true })
				}
			})
		},
		[form, topicPath],
	)

	useEffect(() => {
		if (!topic) return

		const nextDurationHours = getTopicDurationHours(topic)

		applyTopicHours(topic.type, nextDurationHours)
	}, [applyTopicHours, topic])

	useEffect(() => {
		if (!isEditingName) return
		nameInputRef.current?.focus()
		nameInputRef.current?.select()
	}, [isEditingName])

	const currentName = getLocalizedValue(topic?.name as LocaleText, activeLocale)

	const startEditingName = () => {
		skipNameCommitRef.current = false
		setDraftName(currentName)
		setIsEditingName(true)
	}

	const currentTotal =
		(Number(topic?.theoryHours) || 0) +
		(Number(topic?.practiceHours) || 0) +
		(Number(topic?.individualHours) || 0) +
		(Number(topic?.srspHours) || 0) +
		(Number(topic?.srsHours) || 0)

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
					name={`${topicPath}.name` as Path<T>}
					render={({ field }) =>
						isEditingName ? (
							<Input
								ref={(node) => {
									nameInputRef.current = node
									field.ref(node)
								}}
								className='h-8'
								placeholder={text.topicPlaceholder}
								value={draftName}
								onBlur={() => {
									field.onBlur()
									if (skipNameCommitRef.current) {
										skipNameCommitRef.current = false

										return
									}
									field.onChange(updateLocaleText(field.value as LocaleText, activeLocale, draftName))
									setIsEditingName(false)
								}}
								onChange={(event) => setDraftName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault()
										field.onChange(updateLocaleText(field.value as LocaleText, activeLocale, draftName))
										setIsEditingName(false)

										return
									}

									if (event.key === 'Escape') {
										event.preventDefault()
										skipNameCommitRef.current = true
										setIsEditingName(false)
									}
								}}
							/>
						) : (
							<button
								className='h-8 w-full rounded-md px-3 text-left text-sm hover:bg-muted/40'
								type='button'
								onClick={startEditingName}
							>
								{currentName ? (
									currentName
								) : (
									<span className='text-muted-foreground'>{text.topicPlaceholder}</span>
								)}
							</button>
						)
					}
				/>
			</TableCell>
			<TableCell className={cn(getHoursStyle(currentTotal), 'font-semibold')}>
				{formatAsDash(currentTotal)}
			</TableCell>
			<TableCell className={getHoursStyle(topic?.theoryHours)}>{formatAsDash(topic?.theoryHours)}</TableCell>
			<TableCell className={getHoursStyle(topic?.practiceHours)}>{formatAsDash(topic?.practiceHours)}</TableCell>
			<TableCell className={getHoursStyle(topic?.individualHours)}>{formatAsDash(topic?.individualHours)}</TableCell>
			<TableCell className={getHoursStyle(topic?.srspHours)}>{formatAsDash(topic?.srspHours)}</TableCell>
			<EditableHourCell fieldName={`${topicPath}.srsHours` as Path<T>} form={form} />
			<TableCell className='flex space-x-2'>
				<FormField
					control={form.control}
					name={`${topicPath}.type` as Path<T>}
					render={({ field }) => {
						const resolvedType = (field.value as TopicTypeEnum | undefined) ?? TopicTypeEnum.COMBINED

						return (
							<Select
								value={resolvedType}
								onValueChange={(value) => {
									applyTopicHours(
										value as TopicTypeEnum,
										value === TopicTypeEnum.PRACTICAL ? normalizedDurationHours : 2,
									)
								}}
							>
								<SelectTrigger
									className='h-8 min-w-20 w-full'
									title={normalizeTopicType(resolvedType, activeLocale)}
								>
									<SelectValue
										aria-label={normalizeTopicType(resolvedType, activeLocale)}
										className='sr-only'
									/>
								</SelectTrigger>
								<SelectContent>
									{Object.values(TopicTypeEnum).map((type) => {
										const TypeIcon = topicTypeIcons[type]
										const itemToneClassName = topicTypeIconColorClasses[type] ?? ''

										return (
											<SelectItem key={type} value={type}>
												<span className='flex items-center gap-2'>
													<TypeIcon className={cn('h-4 w-4', itemToneClassName)} />
													{normalizeTopicType(type, activeLocale)}
												</span>
											</SelectItem>
										)
									})}
								</SelectContent>
							</Select>
						)
					}}
				/>

				<FormField
					control={form.control}
					name={`${topicPath}.durationHours` as Path<T>}
					render={({ field }) => {
						const resolvedDuration = Number(field.value) || (normalizedDurationHours === 6 ? 6 : 2)
						const isPractical = currentTopic.type === TopicTypeEnum.PRACTICAL

						return (
							<Select
								disabled={!isPractical}
								value={String(resolvedDuration)}
								onValueChange={(value) => {
									const nextDurationHours = Number(value) === 6 ? 6 : 2

									applyTopicHours(currentTopic.type, nextDurationHours)
									field.onChange(nextDurationHours)
								}}
							>
								<SelectTrigger className='h-8 min-w-26 disabled:hidden'>
									<SelectValue aria-label={formatHours(resolvedDuration, activeLocale)} />
								</SelectTrigger>
								<SelectContent>
									{(isPractical ? [2, 6] : [2]).map((hours) => (
										<SelectItem key={hours} value={String(hours)}>
											{formatHours(hours, activeLocale)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)
					}}
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
		prev.activeLocale === next.activeLocale &&
		prev.isSelected === next.isSelected &&
		prev.toggleSelectTopic === next.toggleSelectTopic,
)
