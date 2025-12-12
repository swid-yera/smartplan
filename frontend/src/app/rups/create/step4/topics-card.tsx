'use client'

import { useEffect, useState } from 'react'

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
import { Plus, Trash } from 'lucide-react'
import { type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form'

import { RupTypeEnum } from '@/shared/types'

import type { FormData } from './step4'

interface IProps {
	form: UseFormReturn<FormData>
}

const newTopic = {
	name: '',
	type: 'Theoretical', // Corresponds to TopicTypeEnum.Theoretical
	hours: 0,
}

export function TopicsCard({ form }: IProps) {
	const rupType = useWatch({ control: form.control, name: 'rupType' })
	const disciplines = useWatch({ control: form.control, name: 'disciplines' })

	useEffect(() => {
		const newHours = rupType === RupTypeEnum.THEORY ? 2 : 6

		disciplines.forEach((discipline, disciplineIndex) => {
			discipline.topics.forEach((topic, topicIndex) => {
				if (topic.hours !== newHours) {
					form.setValue(`disciplines.${disciplineIndex}.topics.${topicIndex}.hours`, newHours)
				}
			})
		})
	}, [rupType, disciplines, form])

	const disciplines = useWatch({ control: form.control, name: 'disciplines' })

	const total = {
		hours: 0,
	}

	disciplines.forEach((discipline) => {
		total.hours += discipline.topics.reduce((sum, topic) => sum + (topic.hours || 0), 0)
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Содержание учебной рабочей программы</CardTitle>
				<CardDescription>Добавьте темы занятий для каждой дисциплины.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-8'>№</TableHead>
								<TableHead className='w-[30%]'>Раздел / Результаты обучения</TableHead>
								<TableHead className='w-[40%]'>Темы занятий</TableHead>
								<TableHead>Часы</TableHead>
								<TableHead>Тип занятия</TableHead>
								<TableHead>Действия</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{disciplines.map((discipline, disciplineIndex) => (
								<DisciplineTopics
									key={discipline.code}
									form={form}
									disciplineIndex={disciplineIndex}
									rupType={rupType}
								/>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell colSpan={3} className='text-right font-bold text-base'>
									ИТОГО ПО МОДУЛЮ:
								</TableCell>
								<TableCell className='font-bold text-center text-base'>{total.hours}</TableCell>
								<TableCell colSpan={2}></TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			</CardContent>
		</Card>
	)
}

function DisciplineTopics({
	form,
	disciplineIndex,
	rupType,
}: { form: UseFormReturn<FormData>; disciplineIndex: number; rupType: string }) {
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
		hours: 0,
	}

	sectionTotal.hours = discipline.topics.reduce((sum, topic) => sum + (topic.hours || 0), 0)

	return (
		<>
			{topicFields.map((topicField, topicIndex) => (
				<TopicRow
					key={topicField.id}
					form={form}
					disciplineIndex={disciplineIndex}
					topicIndex={topicIndex}
					isFirst={topicIndex === 0}
					rupType={rupType}
					setTopicToDelete={setTopicToDelete}
				/>
			))}
			<TableRow className='bg-muted/50 hover:bg-muted/50'>
				<TableCell colSpan={3} className='text-right font-bold'>
					<Button
						size='sm'
						variant='ghost'
						onClick={() => append({ ...newTopic, hours: rupType === RupTypeEnum.THEORY ? 2 : 6 })}
					>
						<Plus className='h-4 w-4 mr-2' />
						Добавить тему
					</Button>
					<span className='ml-4'>ВСЕГО ПО РАЗДЕЛУ:</span>
				</TableCell>
				<TableCell className='font-bold text-center'>{sectionTotal.hours}</TableCell>
				<TableCell colSpan={2}></TableCell>
			</TableRow>

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
		</>
	)
}

function TopicRow({
	form,
	disciplineIndex,
	topicIndex,
	isFirst,
	rupType,
	setTopicToDelete,
}: {
	form: UseFormReturn<FormData>
	disciplineIndex: number
	topicIndex: number
	isFirst: boolean
	rupType: string
	setTopicToDelete: (index: number | null) => void
}) {
	const discipline = useWatch({ control: form.control, name: `disciplines.${disciplineIndex}` })

	return (
		<TableRow>
			{isFirst ? (
				<>
					<TableCell className='align-top' rowSpan={discipline.topics.length}>
						{disciplineIndex + 1}
					</TableCell>
					<TableCell className='align-top' rowSpan={discipline.topics.length}>
						<p className='font-semibold'>{discipline.code}</p>
						<p className='text-muted-foreground'>{discipline.name}</p>
					</TableCell>
				</>
			) : null}
			<TableCell className='align-top'>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.name`}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input placeholder='Название темы' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
			<TableCell className='align-top'>
				<p className='w-20 mx-auto text-center font-medium'>
					{rupType === RupTypeEnum.THEORY ? 2 : 6}
				</p>
			</TableCell>
			<TableCell className='align-top'>
				<FormField
					control={form.control}
					name={`disciplines.${disciplineIndex}.topics.${topicIndex}.type`}
					render={({ field }) => (
						<FormItem>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder='Тип' />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{rupType === RupTypeEnum.THEORY && (
										<SelectItem value='Theoretical'>Теоретическая</SelectItem>
									)}
									<SelectItem value='Practical'>Практическая</SelectItem>
									<SelectItem value='Combined'>Комбинированная</SelectItem>
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
