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
import { normalizeTopicType } from '@helpers'
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
	code: string
	name: string
	semesters: Semester[]
	topics: Topic[]
}

type TopicsCardValues = FieldValues & {
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

export function TopicsCard<T extends TopicsCardValues>() {
	const form = useFormContext<T>()
	const rupType = useWatch({ control: form.control, name: 'type' as Path<T> }) ?? ''
	const disciplines = (useWatch({ control: form.control, name: 'disciplines' as Path<T> }) ?? []) as Discipline[]

	// Расчет итогов по всей карточке (модулю)
	const total = disciplines.reduce(
		(acc, disc) => {
			disc.topics?.forEach((t) => {
				acc.theoryHours += Number(t.theoryHours) || 0
				acc.practiceHours += Number(t.practiceHours) || 0
				acc.individualHours += Number(t.individualHours) || 0
				acc.srspHours += Number(t.srspHours) || 0
				acc.srsHours += Number(t.srsHours) || 0
				// totalHours вычисляем как сумму составляющих
				acc.totalHours +=
					(Number(t.theoryHours) || 0) + (Number(t.practiceHours) || 0) + (Number(t.individualHours) || 0)
			})

			return acc
		},
		{ totalHours: 0, theoryHours: 0, practiceHours: 0, individualHours: 0, srspHours: 0, srsHours: 0 },
	)

	// Общее количество "Заявленных" часов (сумма по всем семестрам всех дисциплин)
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
					// Если вы используете useFieldArray для дисциплин здесь:
					const fieldId = _[index]?.id

					return (
						<DisciplineBlock
							key={fieldId || index} // Используйте стабильный ID
							disciplineIndex={index}
							rupType={rupType as RupTypeEnum | ''}
						/>
					)
				})}

				<div className='flex justify-end items-center pt-4 pr-6 space-x-4 border-t'>
					<div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-right'>
						<p className='font-medium'>Заявлено часов в плане:</p>
						<p className='font-bold text-2xl'>{totalDeclaredHours}</p>

						<p className='font-medium'>Распределено тем (часов):</p>
						<div
							className={cn(
								'font-bold text-right text-2xl',
								total.totalHours !== totalDeclaredHours && 'text-destructive',
							)}
						>
							<p>{total.totalHours}</p>
							<p className='text-xs font-normal text-muted-foreground'>
								(Т: {total.theoryHours} / П: {total.practiceHours} / И: {total.individualHours} / СРСП:{' '}
								{total.srspHours} / СРС: {total.srsHours})
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function DisciplineBlock<T extends TopicsCardValues>({
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

	// Расчет итогов внутри одной дисциплины
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
				<div className='font-bold w-16'>{discipline.code}</div>
				<div className='flex-1 font-medium'>{discipline.name}</div>
				<div className='flex gap-2'>
					<Button
						size='sm'
						variant='outline'
						onClick={() => {
							append(newTopic as FieldArray<T, ArrayPath<T>>)
							setIsCollapsed(false)
						}}
					>
						<Plus className='h-4 w-4 mr-1' /> Тема
					</Button>
					<Button size='sm' variant='ghost' onClick={() => setIsCollapsed(!isCollapsed)}>
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
								{topicFields.map((field, index) => (
									<TopicRow
										key={field.key}
										disciplineIndex={disciplineIndex}
										id={field.key}
										rupType={rupType}
										setTopicToDelete={setTopicToDelete}
										topicIndex={index}
									/>
								))}
							</TableBody>
						</SortableContext>
						<TableFooter>
							<TableRow className='bg-muted/5'>
								<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')} colSpan={2}>
									Итого по разделу:
								</TableCell>
								<TableCell className='text-center font-bold'>{sectionTotal.totalHours}ч</TableCell>
								<TableCell className='text-center text-muted-foreground'>{sectionTotal.theoryHours}</TableCell>
								<TableCell className='text-center text-muted-foreground'>
									{sectionTotal.practiceHours}
								</TableCell>
								<TableCell className='text-center text-muted-foreground'>
									{sectionTotal.individualHours}
								</TableCell>
								<TableCell className='text-center text-muted-foreground'>{sectionTotal.srspHours}</TableCell>
								<TableCell className='text-center text-muted-foreground'>{sectionTotal.srsHours}</TableCell>
								<TableCell className={cn('text-right font-medium', hasError && 'text-destructive')} colSpan={2}>
									Заявлено: {declaredForThisDiscipline}ч
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
			// Убираем SNZ, если это практический модуль
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
			<TableCell className='text-center font-bold'>{currentTotal}ч</TableCell>
			<TableCell className='text-center'>{topic?.theoryHours}</TableCell>
			<TableCell className='text-center'>{topic?.practiceHours}</TableCell>
			<TableCell className='text-center'>{topic?.individualHours}</TableCell>
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
					variant='ghost'
					onClick={() => setTopicToDelete(topicIndex)}
				>
					<Trash className='h-4 w-4' />
				</Button>
			</TableCell>
		</TableRow>
	)
}
