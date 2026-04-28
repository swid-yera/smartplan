'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'

import { EditableHourCell } from '@components'
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
	FormField,
	Input,
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
} from '@shadcn'
import { RupTypeEnum, TopicTypeEnum } from '@types'
import { ChevronDown, GripVertical, Plus, Trash } from 'lucide-react'
import {
	type ArrayPath,
	type FieldArray,
	type FieldValues,
	type Path,
	useFieldArray,
	useFormContext,
	useWatch,
} from 'react-hook-form'

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

export function TopicsEdit<T extends IProps>() {
	const form = useFormContext<T>()
	const rupType = useWatch({ control: form.control, name: 'type' as Path<T> }) ?? ''
	const { fields: disciplineFields } = useFieldArray({
		control: form.control,
		name: 'disciplines' as ArrayPath<T>,
		keyName: 'key',
	})

	return (
		<div className='space-y-4'>
			{disciplineFields.map((field, index) => (
				<DisciplineBlock key={field.key} disciplineIndex={index} rupType={rupType as RupTypeEnum | ''} />
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
	rupType,
}: {
	disciplineIndex: number
	rupType: RupTypeEnum | ''
}) {
	const form = useFormContext<T>()
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isSticky, setIsSticky] = useState(false)
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
	const [topicToDelete, setTopicToDelete] = useState<number | null>(null)

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

	useEffect(() => {
		const headerNode = headerRef.current

		if (!headerNode) return

		const tabPanel = headerNode.closest('[role="tabpanel"]')
		const stickyTitle = tabPanel?.querySelector('[data-rup-sticky-title="true"]') as HTMLElement | null
		const fallbackOffset = 100

		const updateStickyOffset = () => {
			const nextOffset = stickyTitle ? Math.ceil(stickyTitle.getBoundingClientRect().height) : fallbackOffset

			setStickyTopPx((prev) => (prev === nextOffset ? prev : nextOffset))
		}

		updateStickyOffset()

		const observer = stickyTitle ? new ResizeObserver(updateStickyOffset) : null

		if (stickyTitle) {
			observer?.observe(stickyTitle)
		}
		window.addEventListener('resize', updateStickyOffset)

		return () => {
			observer?.disconnect()
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

	return (
		<div className='border rounded-lg mb-6'>
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

			<div
				aria-hidden={isCollapsed}
				className={cn(
					'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
					isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
				)}
			>
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
									<TableHead className='w-12 bg-muted/20 text-center'>№</TableHead>
									<TableHead className='min-w-[450px] w-full bg-muted/20'>Темы занятий</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Всего</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Теор</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Прак</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center'>Инд</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center text-xs'>СРСП</TableHead>
									<TableHead className='w-20 bg-muted/20 text-center text-xs'>СРС</TableHead>
									<TableHead className='w-40 bg-muted/20'>Тип</TableHead>
									<TableHead className='w-10 bg-muted/20' />
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
												rupType={rupType}
												setTopicToDelete={setTopicToDelete}
												topicIndex={index}
											/>
										))
									) : (
										<TableRow>
											<TableCell className='h-24 text-center text-muted-foreground' colSpan={10}>
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
										colSpan={2}
									>
										Заявлено: {formatHours(declaredForThisDiscipline)}
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</DndContext>
				</div>
			</div>

			<AlertDialog open={topicToDelete !== null} onOpenChange={() => setTopicToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить тему?</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Отмена</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (topicToDelete !== null) {
									remove(topicToDelete)
									setTopicToDelete(null)
								}
							}}
						>
							Удалить
						</AlertDialogAction>
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
	setTopicToDelete: (index: number | null) => void
}

const TopicRowComponent = ({ id, disciplineIndex, topicIndex, rupType, setTopicToDelete }: ITopicRowProps) => {
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
			<TableCell>
				<Button
					className='h-8 w-8 text-destructive'
					size='icon'
					type='button'
					variant='ghost'
					onClick={() => setTopicToDelete(topicIndex)}
				>
					<Trash className='h-4 w-4' />
				</Button>
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
		prev.setTopicToDelete === next.setTopicToDelete,
)
