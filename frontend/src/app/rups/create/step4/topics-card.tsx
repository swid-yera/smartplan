'use client'

import { useEffect, useState } from 'react'

import { cn } from '@lib'
import { RupTypeEnum, TopicTypeEnum } from '@types'
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
	FormMessage,
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
import { ChevronDown, Plus, Trash } from 'lucide-react'
import { type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form'

import { formatCredits, formatHours } from '@/helpers'

import type { FormData } from './step4'

interface IProps {
	form: UseFormReturn<FormData>
}

const newTopic = {
	name: '',
	type: TopicTypeEnum.Theoretical,
	totalHours: 0,
	theoryHours: 0,
	practiceHours: 0,
	individualHours: 0,
}

const RUP_TYPE_HOURS_CONFIG = {
	[RupTypeEnum.THEORY]: { totalHours: 2, theoryHours: 2, practiceHours: 0, individualHours: 0 },
	[RupTypeEnum.PRACTICE]: { totalHours: 6, theoryHours: 0, practiceHours: 4, individualHours: 2 },
}

export function TopicsCard({ form }: IProps) {
	const rupType = useWatch({ control: form.control, name: 'rupType' })
	const disciplines = useWatch({ control: form.control, name: 'disciplines' })

	// This effect updates the hours for all topics when the global RUP type changes.
	// It does not run on every change to `disciplines` to avoid performance issues and infinite loops.
	useEffect(() => {
		if (!rupType) return

		const newHours = RUP_TYPE_HOURS_CONFIG[rupType as RupTypeEnum]
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
	}, [rupType, form])

	const total = {
		totalHours: 0,
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
	}

	disciplines.forEach((discipline) => {
		discipline.topics.forEach((topic) => {
			total.totalHours += topic.totalHours || 0
			total.theoryHours += topic.theoryHours || 0
			total.practiceHours += topic.practiceHours || 0
			total.individualHours += topic.individualHours || 0
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
					<DisciplineBlock key={discipline.code} disciplineIndex={disciplineIndex} form={form} rupType={rupType} />
				))}
				<div className='flex justify-end items-center pt-4 pr-6 space-x-4'>
					<div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-right'>
						<p className='font-medium'>Должно быть часов:</p>
						<p className='font-bold text-2xl'>{disciplines.reduce((sum, d) => sum + d.totalCredits, 0) * 24}</p>

						<p className='font-medium'>В данный момент:</p>
						<div
							className={cn(
								'font-bold text-right text-2xl',
								total.totalHours !== disciplines.reduce((sum, d) => sum + d.totalCredits, 0) * 24 &&
									'text-destructive',
							)}
						>
							<p>{total.totalHours}</p>
							<p className='text-xs font-normal text-muted-foreground'>
								(Теория: {total.theoryHours} / Практика: {total.practiceHours} / Самост: {total.individualHours}
								)
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
	rupType,
}: {
	form: UseFormReturn<FormData>
	disciplineIndex: number
	rupType: string
}) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const {
		fields: topicFields,
		append,
		remove,
	} = useFieldArray({
		control: form.control,
		name: `disciplines.${disciplineIndex}.topics`,
	})

	const [topicToDelete, setTopicToDelete] = useState<number | null>(null)

	const discipline = useWatch({ control: form.control, name: `disciplines.${disciplineIndex}` })

	const sectionTotal = {
		totalHours: 0,
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
	}

	discipline.topics.forEach((topic) => {
		sectionTotal.totalHours += topic.totalHours || 0
		sectionTotal.theoryHours += topic.theoryHours || 0
		sectionTotal.practiceHours += topic.practiceHours || 0
		sectionTotal.individualHours += topic.individualHours || 0
	})

	const hasError = sectionTotal.totalHours !== 24

	return (
		<div className='border rounded-lg'>
			{/* Discipline Header */}
			<div className='flex items-center p-4 bg-muted/40 rounded-t-lg'>
				<div className='font-semibold pr-4'>{discipline.code}</div>
				<div className='flex-1 font-medium text-left'>{discipline.name}</div>
				<div className='flex items-center space-x-2'>
					<Button
						size='sm'
						type='button'
						variant='ghost'
						onClick={() =>
							append({
								...newTopic,
								totalHours: rupType === RupTypeEnum.THEORY ? 2 : 6,
								theoryHours: rupType === RupTypeEnum.THEORY ? 2 : 0,
								practiceHours: rupType === RupTypeEnum.THEORY ? 0 : 4,
								individualHours: rupType === RupTypeEnum.THEORY ? 0 : 2,
							})
						}
					>
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
				<div className='p-4'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-16 text-center'>№</TableHead>
								<TableHead>Темы занятий</TableHead>
								<TableHead className='w-20 text-center'>Всего</TableHead>
								<TableHead className='w-20 text-center'>Теория</TableHead>
								<TableHead className='w-20 text-center'>Практика</TableHead>
								<TableHead className='w-20 text-center'>Самост.</TableHead>
								<TableHead className='w-48'>Тип занятия</TableHead>
								<TableHead className='w-24'>Действия</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{topicFields.map((topicField, topicIndex) => (
								<TopicRow
									key={topicField.id}
									disciplineIndex={disciplineIndex}
									form={form}
									rupType={rupType}
									setTopicToDelete={setTopicToDelete}
									topicIndex={topicIndex}
								/>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell className='text-right font-bold' colSpan={2}>
									Итого по разделу:
								</TableCell>
								<TableCell className={cn('font-bold text-center', hasError && 'text-destructive')}>
									{sectionTotal.totalHours}
								</TableCell>
								<TableCell className={cn('font-bold text-center', hasError && 'text-destructive')}>
									{sectionTotal.theoryHours}
								</TableCell>
								<TableCell className={cn('font-bold text-center', hasError && 'text-destructive')}>
									{sectionTotal.practiceHours}
								</TableCell>
								<TableCell className={cn('font-bold text-center', hasError && 'text-destructive')}>
									{sectionTotal.individualHours}
								</TableCell>
								<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')} colSpan={2}>
									{formatHours(sectionTotal.totalHours)} ={' '}
									{formatCredits(Number((sectionTotal.totalHours / 24).toFixed(3)))}
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
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

function TopicRow({
	form,
	disciplineIndex,
	topicIndex,
	rupType,
	setTopicToDelete,
}: {
	form: UseFormReturn<FormData>
	disciplineIndex: number
	topicIndex: number
	rupType: string
	setTopicToDelete: (index: number | null) => void
}) {
	const topic = useWatch({
		control: form.control,
		name: `disciplines.${disciplineIndex}.topics.${topicIndex}`,
	})

	// This effect updates the hours for a single topic when its type changes.
	useEffect(() => {
		let newTotalHours = 0,
			newTheoryHours = 0,
			newPracticeHours = 0,
			newIndividualHours = 0

		// Determine hours based on the topic's specific type
		switch (topic.type) {
			case TopicTypeEnum.Theoretical:
			case TopicTypeEnum.Combined:
				newTotalHours = 2
				newTheoryHours = 2
				newPracticeHours = 0
				newIndividualHours = 0
				break
			case TopicTypeEnum.Practical:
				newTotalHours = 6
				newTheoryHours = 0
				newPracticeHours = 4
				newIndividualHours = 2
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
	}, [topic.type, disciplineIndex, topicIndex, form])

	return (
		<TableRow>
			<TableCell className='align-top font-medium text-center'>{topicIndex + 1}</TableCell>
			<TableCell className='align-top'>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.name`}
					render={({ field }) => (
						<FormItem>
							<FormControl className='min-w-[200px]'>
								<Input placeholder='Название темы' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell className='align-top text-center font-medium'>
				<p>{topic.totalHours}</p>
			</TableCell>
			<TableCell className='align-top text-center font-medium'>{topic.theoryHours}</TableCell>
			<TableCell className='align-top text-center font-medium'>{topic.practiceHours}</TableCell>
			<TableCell className='align-top text-center font-medium'>
				<p>{topic.individualHours}</p>
			</TableCell>
			<TableCell className='align-top'>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.type`}
					render={({ field }) => (
						<FormItem>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder='Тип' />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{rupType === RupTypeEnum.THEORY && (
										<SelectItem value={TopicTypeEnum.Theoretical}>Теоретическая</SelectItem>
									)}
									<SelectItem value={TopicTypeEnum.Practical}>Практическая</SelectItem>
									<SelectItem value={TopicTypeEnum.Combined}>Комбинированная</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell className='align-top'>
				<Button size='icon' type='button' variant='ghost' onClick={() => setTopicToDelete(topicIndex)}>
					<Trash className='h-4 w-4' />
				</Button>
			</TableCell>
		</TableRow>
	)
}
