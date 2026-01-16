'use client'

import { useEffect, useState } from 'react'

import { EditableHourCell } from '@components'
import { formatHours } from '@helpers'
import { TopicTypeEnum } from '@types'
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
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { Trash } from 'lucide-react'
import {
	type ArrayPath,
	type FieldValues,
	type Path,
	type PathValue,
	useFieldArray,
	useFormContext,
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
	code: string
	name: string
	totalHours: number // Добавил в тип, так как вы его используете
	semesters: Semester[]
	topic: Topic[]
}

type DisciplineCardValues = FieldValues & {
	disciplines: Discipline[]
}

export function DisciplineCard<T extends DisciplineCardValues>() {
	const { control, watch, formState } = useFormContext<T>()

	console.log(formState.errors)

	const {
		fields: disciplineFields,
		append,
		remove,
	} = useFieldArray({
		control,
		name: 'disciplines' as ArrayPath<T>,
	})

	const [disciplineToDelete, setDisciplineToDelete] = useState<number | null>(null)

	// Заменяем useWatch на watch()
	// Это заставит компонент ререндериться при любом изменении в массиве disciplines
	const disciplines = watch('disciplines' as Path<T>) as Discipline[]

	const newDiscipline = {
		code: '',
		name: '',
		totalHours: 0,
		semesters: Array.from({ length: 8 }, (_, i) => ({
			semester: i + 1,
			totalHours: 0,
		})),
		topics: [
			{
				name: '1',
				type: TopicTypeEnum.SNZ,
				theoryHours: 0,
				practiceHours: 0,
				individualHours: 0,
				srspHours: 0,
				srsHours: 0,
			},
		],
	}

	// Вычисления итогов
	const totalModuleHours =
		disciplines?.reduce((acc, d) => {
			const disciplineSum = d.semesters?.reduce((sum, s) => sum + (Number(s.totalHours) || 0), 0) || 0

			return acc + disciplineSum
		}, 0) || 0

	const semesterTotals = Array(8).fill(0)

	disciplines?.forEach((discipline) => {
		discipline.semesters?.forEach((semester, i) => {
			if (i < 8) {
				semesterTotals[i] += Number(semester.totalHours) || 0
			}
		})
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Распределение часов</CardTitle>
				<CardDescription>Создание дисциплин и расчет часов</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[35%]' rowSpan={3}>
									Код и название
								</TableHead>
								<TableHead className='text-center' rowSpan={3}>
									Общее кол-во
								</TableHead>
								<TableHead className='text-center' colSpan={8}>
									По семестрам
								</TableHead>
							</TableRow>
							<TableRow>
								{Array.from({ length: 4 }, (_, i) => (
									<TableHead key={i} className='text-center border-r' colSpan={2}>
										{i + 1} курс
									</TableHead>
								))}
							</TableRow>
							<TableRow>
								{Array.from({ length: 8 }, (_, i) => (
									<TableHead key={i} className='text-center border-r'>
										{i + 1}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{disciplineFields.map((field, index) => (
								<DisciplineRow
									key={field.id}
									disciplineIndex={index}
									setDisciplineToDelete={setDisciplineToDelete}
								/>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell className='font-bold'>Всего:</TableCell>
								<TableCell className='text-right font-bold'>{formatHours(totalModuleHours)}</TableCell>
								{semesterTotals.map((total, i) => (
									<TableCell key={i} className='text-center font-bold'>
										{total}ч
									</TableCell>
								))}
							</TableRow>
						</TableFooter>
					</Table>
				</div>
				<Button
					className='mt-4'
					type='button'
					variant='outline'
					onClick={() => append(newDiscipline as PathValue<T, ArrayPath<T>>)}
				>
					Добавить дисциплину
				</Button>

				<AlertDialog
					open={disciplineToDelete !== null}
					onOpenChange={(open) => !open && setDisciplineToDelete(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Подтверждение</AlertDialogTitle>
							<AlertDialogDescription>
								Удалить дисциплину {disciplineToDelete !== null && disciplines?.[disciplineToDelete]?.code}?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Отмена</AlertDialogCancel>
							<AlertDialogAction
								className='bg-destructive'
								onClick={() => {
									if (disciplineToDelete !== null) {
										remove(disciplineToDelete)
										setDisciplineToDelete(null)
									}
								}}
							>
								Удалить
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	)
}

function DisciplineRow<T extends DisciplineCardValues>({
	disciplineIndex,
	setDisciplineToDelete,
}: {
	disciplineIndex: number
	setDisciplineToDelete: (index: number | null) => void
}) {
	const form = useFormContext<T>()

	// Заменяем useWatch на watch для конкретной строки
	const watchedSemesters = form.watch(`disciplines.${disciplineIndex}.semesters` as Path<T>) as Discipline['semesters']

	const totalHours = watchedSemesters?.reduce((acc, sem) => acc + (Number(sem.totalHours) || 0), 0) || 0

	useEffect(() => {
		const currentTotal = form.getValues(`disciplines.${disciplineIndex}.totalHours` as Path<T>)

		if (currentTotal !== totalHours) {
			form.setValue(`disciplines.${disciplineIndex}.totalHours` as Path<T>, totalHours as PathValue<T, Path<T>>, {
				shouldDirty: true,
			})
		}
	}, [totalHours, disciplineIndex, form])

	return (
		<TableRow className='[&>:not(:last-child)]:border-r'>
			<TableCell>
				<div className='space-y-2'>
					<div className='flex items-start gap-2 min-w-64'>
						<div className='grow'>
							<FormField
								control={form.control}
								name={`disciplines.${disciplineIndex}.code` as Path<T>}
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input placeholder='Код' {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
						<Button
							size='icon'
							type='button'
							variant='outline'
							onClick={() => setDisciplineToDelete(disciplineIndex)}
						>
							<Trash className='h-4 w-4' />
						</Button>
					</div>
					<FormField
						control={form.control}
						name={`disciplines.${disciplineIndex}.name` as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input placeholder='Название' {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
				</div>
			</TableCell>
			<TableCell className='text-center font-medium'>{formatHours(totalHours)}</TableCell>
			{Array.from({ length: 8 }).map((_, semesterIndex) => (
				<EditableHourCell
					key={semesterIndex}
					fieldName={`disciplines.${disciplineIndex}.semesters.${semesterIndex}.totalHours` as Path<T>}
					form={form}
				/>
			))}
		</TableRow>
	)
}
