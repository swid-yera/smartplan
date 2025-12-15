'use client'

import { useEffect, useRef, useState } from 'react'

import {
	DndContext,
	type DragEndEvent,
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
import { cn } from '@lib'
import { RupModuleTypeEnum, TopicTypeEnum } from '@types'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@ui'
import { ChevronDown, GripVertical, Info, Plus, Trash } from 'lucide-react'
import { type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form'

import { EditableHourCell } from '@/components/editable-hour-cell'
import { formatHours } from '@/helpers'

import type { FormData } from './step4'

interface IProps {
	form: UseFormReturn<FormData>
}

const newTopic = {
	name: '',
	type: TopicTypeEnum.SNZ,
	totalHours: 0,
	theoryHours: 0,
	practiceHours: 0,
	individualHours: 0,
	srspHours: 0,
	srsHours: 0,
}

const RUP_TYPE_HOURS_CONFIG = {
	[RupModuleTypeEnum.THEORY]: { totalHours: 2, theoryHours: 2, practiceHours: 0, individualHours: 0 },
	[RupModuleTypeEnum.PRACTICE]: { totalHours: 6, theoryHours: 0, practiceHours: 4, individualHours: 2 },
}

export function TopicsCard({ form }: IProps) {
	const rupModuleType = useWatch({ control: form.control, name: 'rupModuleType' }) ?? ''
	const disciplines = useWatch({ control: form.control, name: 'disciplines' }) ?? ''

	// This effect updates the hours for all topics when the global RUP type changes.
	// It does not run on every change to `disciplines` to avoid performance issues and infinite loops.
	useEffect(() => {
		if (!rupModuleType) return

		const newHours = RUP_TYPE_HOURS_CONFIG[rupModuleType as RupModuleTypeEnum]
		const currentDisciplines = form.getValues('disciplines')

		currentDisciplines.forEach((discipline, disciplineIndex) => {
			discipline.topics.forEach((topic, topicIndex) => {
				form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.totalHours`, newHours.totalHours)
				form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.theoryHours`, newHours.theoryHours)
				form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.practiceHours`, newHours.practiceHours)
				form.setValue(
					`disciplines.${disciplineIndex}.topics.${topicIndex}.individualHours`,
					newHours.individualHours,
				)
			})
		})
	}, [rupModuleType, form])

	const total = {
		totalHours: 0,
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
		srspHours: 0,
		srsHours: 0,
	}

	disciplines.forEach((discipline) => {
		discipline.topics.forEach((topic) => {
			total.totalHours += topic.totalHours || 0
			total.theoryHours += topic.theoryHours || 0
			total.practiceHours += topic.practiceHours || 0
			total.individualHours += topic.individualHours || 0
			total.srspHours += topic.srspHours || 0
			total.srsHours += topic.srsHours || 0
		})
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Содержание учебной рабочей программы</CardTitle>
				<CardDescription>Добавьте темы занятий для каждой дисциплины.</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{disciplines.map((discipline, disciplineIndex) => (
					<DisciplineBlock
						key={discipline.code}
						disciplineIndex={disciplineIndex}
						form={form}
						rupModuleType={rupModuleType}
					/>
				))}
				<div className='flex justify-end items-center pt-4 pr-6 space-x-4'>
					<div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-right'>
						<p className='font-medium'>Заявлено часов:</p>
						<p className='font-bold text-2xl'>{disciplines.reduce((sum, d) => sum + d.totalHours, 0)}</p>

						<p className='font-medium'>Текущие общие часы:</p>
						<div
							className={cn(
								'font-bold text-right text-2xl',
								total.totalHours !== disciplines.reduce((sum, d) => sum + d.totalHours, 0) &&
									'text-destructive',
							)}
						>
							<p>{total.totalHours}</p>
							<p className='text-xs font-normal text-muted-foreground'>
								(Теория: {total.theoryHours} / Практика: {total.practiceHours} / Индивид:{' '}
								{total.individualHours} / СРСП: {total.srspHours} / СРС: {total.srsHours})
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function DisciplineBlock({
	form,
	disciplineIndex,
	rupModuleType,
}: {
	form: UseFormReturn<FormData>
	disciplineIndex: number
	rupModuleType: string
}) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const tableFooterRef = useRef<HTMLTableSectionElement>(null)
	const {
		fields: topicFields,
		append,
		move,
		remove,
	} = useFieldArray({
		control: form.control,
		name: `disciplines.${disciplineIndex}.topics` as const,
		keyName: 'key', // Use 'key' instead of 'id' to avoid conflicts with dnd-kit
	})
	const [topicToDelete, setTopicToDelete] = useState<number | null>(null)

	const discipline = useWatch({ control: form.control, name: `disciplines.${disciplineIndex}` })

	const sectionTotal = {
		totalHours: 0,
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
		srspHours: 0,
		srsHours: 0,
	}

	discipline.topics.forEach((topic) => {
		sectionTotal.totalHours += topic.totalHours || 0
		sectionTotal.theoryHours += topic.theoryHours || 0
		sectionTotal.practiceHours += topic.practiceHours || 0
		sectionTotal.individualHours += topic.individualHours || 0
		sectionTotal.srspHours += topic.srspHours || 0
		sectionTotal.srsHours += topic.srsHours || 0
	})

	const hasError = sectionTotal.totalHours !== discipline.totalHours

	const onAddNewTopic = () => {
		append(newTopic, { shouldFocus: true })
		setIsCollapsed(false)
	}

	const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor))

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (active && over && active.id !== over.id) {
			const oldIndex = topicFields.findIndex((topic) => topic.key === active.id)
			const newIndex = topicFields.findIndex((topic) => topic.key === over.id)

			move(oldIndex, newIndex)
		}
	}

	return (
		<div className='border rounded-lg rounded-t-none'>
			{/* Discipline Header */}
			<div className='flex items-center p-4 bg-accent z-10 sticky top-0'>
				<div className='font-semibold pr-4'>{discipline.code}</div>
				<div className='flex-1 font-medium text-left'>{discipline.name}</div>
				<div className='flex items-center space-x-2'>
					<Button size='sm' type='button' variant='ghost' onClick={() => onAddNewTopic()}>
						<Plus className='h-4 w-4 mr-2' />
						Добавить тему
					</Button>
					<Button size='sm' variant='ghost' onClick={() => setIsCollapsed(!isCollapsed)}>
						<ChevronDown />
						{isCollapsed ? 'Показать' : 'Скрыть'}
					</Button>
				</div>
			</div>

			{/* Topics Table */}
			{!isCollapsed && (
				<DndContext
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis]}
					sensors={sensors}
					onDragEnd={handleDragEnd}
				>
					<div className='p-4'>
						<Table>
							<TableHeader>
								<TableRow className='*:p-2'>
									<TableHead className='w-12 text-center'>№</TableHead>
									<TableHead>Темы занятий</TableHead>
									<TableHead className='w-20 text-center'>Всего</TableHead>
									<TableHead className='w-20 text-center'>Теория</TableHead>
									<TableHead className='w-20 text-center'>Практика</TableHead>
									<TableHead className='w-20 text-center'>Индивидуальная</TableHead>
									<TableHead className='w-20 text-center'>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger className='flex items-center justify-center w-full gap-1'>
													СРСП <Info className='w-3 h-3' />
												</TooltipTrigger>
												<TooltipContent>
													<p>Самостоятельная работа студента с преподавателем</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</TableHead>
									<TableHead className='w-20 text-center'>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger className='flex items-center justify-center w-full gap-1'>
													СРС <Info className='w-3 h-3' />
												</TooltipTrigger>
												<TooltipContent>
													<p>Самостоятельная работа студента</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</TableHead>
									<TableHead className='w-48 text-end'>Тип занятия</TableHead>
									<TableHead className='w-12' />
								</TableRow>
							</TableHeader>

							<SortableContext
								items={topicFields.map((field) => field.key)}
								strategy={verticalListSortingStrategy}
							>
								<TableBody>
									{topicFields.map((topicField, topicIndex) => (
										<TopicRow
											key={topicField.key}
											disciplineIndex={disciplineIndex}
											form={form}
											id={topicField.key}
											rupModuleType={rupModuleType}
											setTopicToDelete={setTopicToDelete}
											topicIndex={topicIndex}
										/>
									))}
								</TableBody>
							</SortableContext>

							<TableFooter ref={tableFooterRef}>
								<TableRow>
									<TableCell
										className={cn('text-right font-bold', hasError && 'text-destructive')}
										colSpan={2}
									>
										Итого по разделу:
									</TableCell>
									<TableCell className={cn('font-bold text-center', hasError && 'text-destructive')}>
										{formatHours(sectionTotal.totalHours)}
									</TableCell>
									<TableCell className='font-bold text-center'>{sectionTotal.theoryHours}ч</TableCell>
									<TableCell className='font-bold text-center'>{sectionTotal.practiceHours}ч</TableCell>
									<TableCell className='font-bold text-center'>{sectionTotal.individualHours}ч</TableCell>
									<TableCell className='font-bold text-center'>{sectionTotal.srspHours}ч</TableCell>
									<TableCell className='font-bold text-center'>{sectionTotal.srsHours}ч</TableCell>
									<TableCell
										className={cn('text-right font-bold', hasError && 'text-destructive')}
										colSpan={2}
									>
										Заявлено: {formatHours(discipline.totalHours)}
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
				</DndContext>
			)}

			<AlertDialog open={topicToDelete !== null} onOpenChange={(isOpen) => !isOpen && setTopicToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
						<AlertDialogDescription>
							Вы точно хотите удалить тему{' '}
							<span className='font-medium'>
								{topicToDelete !== null && discipline.topics[topicToDelete]?.name}
							</span>
							?
						</AlertDialogDescription>
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

const TopicRow = ({
	form,
	id,
	disciplineIndex,
	topicIndex,
	rupModuleType,
	setTopicToDelete,
}: {
	form: UseFormReturn<FormData>
	id: string
	disciplineIndex: number
	topicIndex: number
	rupModuleType: string
	setTopicToDelete: (index: number | null) => void
}) => {
	const topic = useWatch({
		control: form.control,
		name: `disciplines.${disciplineIndex}.topics.${topicIndex}`,
	})

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1 : 0,
		position: 'relative' as const,
	}

	// This effect updates the hours for a single topic when its type changes.
	useEffect(() => {
		if (!topic) return

		// determine counting hours 2 or 6, depends at rup module type
		let countingHours: 2 | 6 = 2

		if (rupModuleType === RupModuleTypeEnum.THEORY) {
			countingHours = 2
		} else if (rupModuleType === RupModuleTypeEnum.PRACTICE) {
			countingHours = 6
		}

		let newTotalHours = 0,
			newTheoryHours = 0,
			newPracticeHours = 0,
			newIndividualHours = 0

		// Determine hours based on the topic's specific type
		switch (topic.type) {
			case TopicTypeEnum.SNZ:
				newTotalHours = countingHours
				newTheoryHours = 0
				newPracticeHours = 0
				newIndividualHours = countingHours
				break
			case TopicTypeEnum.Combined:
				newTotalHours = countingHours
				newTheoryHours = countingHours
				newPracticeHours = 0
				newIndividualHours = 0
				break
			case TopicTypeEnum.Practical:
				newTotalHours = countingHours
				newTheoryHours = 0
				newPracticeHours = countingHours
				newIndividualHours = 0
				break
		}

		// Only update form values if they have actually changed to prevent an infinite loop
		if (
			topic.totalHours !== newTotalHours ||
			topic.theoryHours !== newTheoryHours ||
			topic.practiceHours !== newPracticeHours ||
			topic.individualHours !== newIndividualHours
		) {
			form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.totalHours`, newTotalHours)
			form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.theoryHours`, newTheoryHours)
			form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.practiceHours`, newPracticeHours)
			form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.individualHours`, newIndividualHours)
		}
	}, [topic?.type])

	return (
		<TableRow ref={setNodeRef} style={style} {...attributes}>
			<TableCell className='align-middle font-medium text-center w-24'>
				<div className='flex items-center justify-center gap-2'>
					<button className='cursor-grab' type='button' {...listeners}>
						<GripVertical className='h-4 w-4 text-muted-foreground' />
					</button>
					<span>{topicIndex + 1}</span>
				</div>
			</TableCell>
			<TableCell className='align-middle'>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.name`}
					render={({ field }) => (
						<FormItem>
							<FormControl className='min-w-[200px]'>
								<Input placeholder='Название темы' {...field} />
							</FormControl>
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell className='align-middle text-center font-bold'>
				<p>{topic.totalHours}ч</p>
			</TableCell>
			<TableCell className='align-middle text-center font-medium'>{topic.theoryHours}ч</TableCell>
			<TableCell className='align-middle text-center font-medium'>{topic.practiceHours}ч</TableCell>
			<TableCell className='align-middle text-center font-medium'>
				<p>{topic.individualHours}ч</p>
			</TableCell>
			<EditableHourCell fieldName={`disciplines.${disciplineIndex}.topics.${topicIndex}.srspHours`} form={form} />
			<EditableHourCell fieldName={`disciplines.${disciplineIndex}.topics.${topicIndex}.srsHours`} form={form} />
			<TableCell className='align-middle'>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.type`}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Select defaultValue={field.value} onValueChange={field.onChange}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Тип занятия' />
									</SelectTrigger>
									<SelectContent>
										{rupModuleType === RupModuleTypeEnum.THEORY && (
											<SelectItem value={TopicTypeEnum.SNZ}>СНЗ</SelectItem>
										)}
										<SelectItem value={TopicTypeEnum.Practical}>Практическая</SelectItem>
										<SelectItem value={TopicTypeEnum.Combined}>Комбинированная</SelectItem>
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell className='align-middle'>
				<Button size='icon' type='button' variant='ghost' onClick={() => setTopicToDelete(topicIndex)}>
					<Trash className='h-4 w-4' />
				</Button>
			</TableCell>
		</TableRow>
	)
}

TopicRow.displayName = 'TopicRow'
