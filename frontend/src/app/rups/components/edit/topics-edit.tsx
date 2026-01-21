'use client'

import { useEffect, useMemo, useState } from 'react'

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
import { formatHours, getHoursStyle, normalizeTopicType } from '@helpers'
import { cn } from '@lib'
import { RupTypeEnum, TopicTypeEnum } from '@types'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
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
} from '@ui'
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

// --- Types ---
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
	const disciplines = (useWatch({ control: form.control, name: 'disciplines' as Path<T> }) ?? []) as Discipline[]

	// global total hours
	const total = disciplines.reduce(
		(acc, disc) => {
			disc.topics?.forEach((t) => {
				acc.theoryHours += Number(t.theoryHours) || 0
				acc.practiceHours += Number(t.practiceHours) || 0
				acc.individualHours += Number(t.individualHours) || 0
				acc.srspHours += Number(t.srspHours) || 0
				acc.srsHours += Number(t.srsHours) || 0

				acc.totalHours +=
					(Number(t.theoryHours) || 0) + (Number(t.practiceHours) || 0) + (Number(t.individualHours) || 0)
			})

			return acc
		},
		{ totalHours: 0, theoryHours: 0, practiceHours: 0, individualHours: 0, srspHours: 0, srsHours: 0 },
	)

	// declared total hours
	const totalDeclaredHours = disciplines.reduce(
		(sum, d) => sum + (d.semesters?.reduce((acc, s) => acc + (Number(s.totalHours) || 0), 0) || 0),
		0,
	)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Содержание учебной рабочей программы</CardTitle>
				<CardDescription>Добавьте темы занятий для каждой дисциплины.</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{disciplines.map((_, index) => {
					const fieldId = _[index]?.id

					return (
						<DisciplineBlock
							key={fieldId || index}
							disciplineIndex={index}
							rupType={rupType as RupTypeEnum | ''}
						/>
					)
				})}

				{/* summary section */}
				<div className='mt-10 rounded-xl border p-1'>
					<div className='px-4 py-2 font-semibold italic uppercase tracking-wider text-xs'>
						Сводная информация по всем дисциплинам
					</div>
					<Table>
						<TableHeader>
							<TableRow className=''>
								<TableHead className='text-right font-medium text-muted-foreground' colSpan={2}>
									Категория
								</TableHead>
								<TableHead className='w-24 text-center font-bold text-foreground'>Всего</TableHead>
								<TableHead className='w-20 text-center text-xs'>Теор</TableHead>
								<TableHead className='w-20 text-center text-xs'>Прак</TableHead>
								<TableHead className='w-20 text-center text-xs'>Инд</TableHead>
								<TableHead className='w-20 text-center text-xs text-blue-600/80'>СРСП</TableHead>
								<TableHead className='w-20 text-center text-xs text-blue-600/80'>СРС</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{/* Итого распределено */}
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
								<TableCell className='text-center text-muted-foreground italic'>
									{total.srspHours || 0}
								</TableCell>
								<TableCell className='text-center text-muted-foreground italic'>
									{total.srsHours || 0}
								</TableCell>
							</TableRow>

							{/* Заявлено в плане */}
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
			</CardContent>
		</Card>
	)
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

	const discipline = useWatch({
		control: form.control,
		name: `disciplines.${disciplineIndex}` as Path<T>,
	}) as Discipline

	if (!discipline) return null

	const sectionTotal = (discipline.topics || []).reduce(
		(acc, t) => {
			const tHours = (Number(t.theoryHours) || 0) + (Number(t.practiceHours) || 0) + (Number(t.individualHours) || 0)

			acc.totalHours += tHours
			acc.theoryHours += Number(t.theoryHours) || 0
			acc.practiceHours += Number(t.practiceHours) || 0
			acc.individualHours += Number(t.individualHours) || 0
			acc.srspHours += Number(t.srspHours) || 0
			acc.srsHours += Number(t.srsHours) || 0

			return acc
		},
		{ totalHours: 0, theoryHours: 0, practiceHours: 0, individualHours: 0, srspHours: 0, srsHours: 0 },
	)

	const declaredForThisDiscipline = discipline.semesters?.reduce((acc, s) => acc + (Number(s.totalHours) || 0), 0) || 0
	const hasError = sectionTotal.totalHours !== declaredForThisDiscipline

	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor))

	return (
		<div className='border rounded-lg overflow-hidden mb-6'>
			<div className='flex items-center p-3 bg-muted/50'>
				<div className='ml-2 flex-1 font-medium'>{discipline.name}</div>
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
						<Plus className='h-4 w-4 mr-1' /> Тема
					</Button>
					<Button size='sm' type='button' variant='ghost' onClick={() => setIsCollapsed(!isCollapsed)}>
						<ChevronDown className={cn('transition-transform', isCollapsed && '-rotate-90')} />
					</Button>
				</div>
			</div>

			{!isCollapsed && (
				<DndContext
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis]}
					sensors={sensors}
					onDragEnd={(e) => {
						const { active, over } = e

						if (active && over && active.id !== over.id) {
							move(
								topicFields.findIndex((f) => f.key === active.id),
								topicFields.findIndex((f) => f.key === over.id),
							)
						}
					}}
				>
					<Table>
						<TableHeader>
							<TableRow className='bg-muted/20'>
								<TableHead className='w-12 text-center'>№</TableHead>
								<TableHead>Темы занятий</TableHead>
								<TableHead className='w-20 text-center'>Всего</TableHead>
								<TableHead className='w-20 text-center'>Теор</TableHead>
								<TableHead className='w-20 text-center'>Прак</TableHead>
								<TableHead className='w-20 text-center'>Инд</TableHead>
								<TableHead className='w-20 text-center text-xs'>СРСП</TableHead>
								<TableHead className='w-20 text-center text-xs'>СРС</TableHead>
								<TableHead className='w-40'>Тип</TableHead>
								<TableHead className='w-10' />
							</TableRow>
						</TableHeader>
						<SortableContext items={topicFields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
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
							<TableRow className='bg-muted/5'>
								<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')} colSpan={2}>
									Всего часов:
								</TableCell>
								<TableCell className='text-center font-bold'>
									{sectionTotal.totalHours == 0 ? '—' : sectionTotal.totalHours}
								</TableCell>
								<TableCell className='text-center'>
									{sectionTotal.theoryHours == 0 ? '—' : sectionTotal.theoryHours}
								</TableCell>
								<TableCell className='text-center'>
									{sectionTotal.practiceHours == 0 ? '—' : sectionTotal.practiceHours}
								</TableCell>
								<TableCell className='text-center'>
									{sectionTotal.individualHours == 0 ? '—' : sectionTotal.individualHours}
								</TableCell>
								<TableCell className='text-center'>
									{sectionTotal.srspHours == 0 ? '—' : sectionTotal.srspHours}
								</TableCell>
								<TableCell className='text-center'>
									{sectionTotal.srsHours == 0 ? '—' : sectionTotal.srsHours}
								</TableCell>
								<TableCell className={cn('text-right font-medium', hasError && 'text-destructive')} colSpan={2}>
									Заявлено: {formatHours(declaredForThisDiscipline)}
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</DndContext>
			)}

			<AlertDialog open={topicToDelete !== null} onOpenChange={() => setTopicToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить тему?</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Отмена</AlertDialogCancel>
						<AlertDialogAction onClick={() => topicToDelete !== null && remove(topicToDelete)}>
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

const TopicRow = ({ id, disciplineIndex, topicIndex, rupType, setTopicToDelete }: ITopicRowProps) => {
	const form = useFormContext()
	const topic = useWatch({ name: `disciplines.${disciplineIndex}.topics.${topicIndex}` }) as Topic
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
	}, [topic?.type, rupType])

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
				{currentTotal == 0 ? '—' : currentTotal}
			</TableCell>
			<TableCell className={getHoursStyle(topic?.theoryHours)}>
				{topic?.theoryHours == 0 ? '—' : topic?.theoryHours}
			</TableCell>
			<TableCell className={getHoursStyle(topic?.practiceHours)}>
				{topic?.practiceHours == 0 ? '—' : topic?.practiceHours}
			</TableCell>
			<TableCell className={getHoursStyle(topic?.individualHours)}>
				{topic?.individualHours == 0 ? '—' : topic?.individualHours}
			</TableCell>
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
