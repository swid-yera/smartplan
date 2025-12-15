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
	Input,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { Info, Trash } from 'lucide-react'
import {
	type ArrayPath,
	type FieldValues,
	type Path,
	type PathValue,
	useFieldArray,
	useFormContext,
	useWatch,
} from 'react-hook-form'

import { EditableHourCell } from '@/components/editable-hour-cell'
import { formatHours } from '@/helpers'
import { TopicTypeEnum } from '@/shared/types'

type Discipline = {
	code: string
	name: string
	totalHours: number
	semesters: { semester: number; hours: number }[]
}

type DisciplineCardValues = FieldValues & {
	disciplines: Discipline[]
}

export function DisciplineCard<T extends DisciplineCardValues>() {
	const form = useFormContext<T>()

	const {
		fields: disciplineFields,
		append,
		remove,
	} = useFieldArray({
		control: form.control,
		name: 'disciplines' as ArrayPath<T>,
	})

	const [disciplineToDelete, setDisciplineToDelete] = useState<number | null>(null)

	const disciplines = useWatch({
		control: form.control,
		name: 'disciplines' as Path<T>,
	}) as Discipline[]

	const newDiscipline = {
		code: '',
		name: '',
		totalHours: 0,
		semesters: Array.from({ length: 8 }, (_, i) => ({
			semester: i + 1,
			hours: 0,
		})),
		topics: [
			{
				name: '',
				type: TopicTypeEnum.Combined,
				totalHours: 0,
				theoryHours: 0,
				practiceHours: 0,
				individualHours: 0,
			},
		],
	}

	const totalModuleHours = disciplines?.map((d) => d.totalHours).reduce((a, b) => a + b, 0)

	const semesterTotals = Array(8).fill(0)

	disciplines?.forEach((discipline) => {
		discipline.semesters.forEach((semester, i) => {
			semesterTotals[i] += semester.hours || 0
		})
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					Распределение часов по семестру, создание разделов/дисциплин учебной рабочей программы
				</CardTitle>
				<CardDescription>
					Распределение часов по семестру, создание разделов/дисциплин и высчитывания общее количество часов в
					учебном плане
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className='text-sm text-primary text-balance mt-2'>
					<Info className='inline mr-2' />
					Часы по семестрам считаются в академических часах. Каждая дисциплина должна иметь минимум один семестр.
				</p>

				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='align-bottom w-[30%] pb-2' rowSpan={3}>
									Код и название дисциплины/модуля
								</TableHead>
								<TableHead className='align-bottom text-center pb-2' rowSpan={3}>
									Общее количество часов <br /> в модуле
								</TableHead>
								<TableHead className='text-center' colSpan={8}>
									Из них по семестрам
								</TableHead>
							</TableRow>
							<TableRow>
								{Array.from({ length: 4 }, (_, i) => (
									<TableHead key={i} className='text-center border-r last:border-r-0' colSpan={2}>
										{i + 1} курс
									</TableHead>
								))}
							</TableRow>
							<TableRow>
								{Array.from({ length: 8 }, (_, i) => (
									<TableHead key={i} className='text-center border-r last:border-r-0 py-2'>
										{i + 1}
										<br />
										семестр
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{disciplineFields.map((disciplineField, disciplineIndex) => (
								<DisciplineRow
									key={disciplineField.id}
									disciplineIndex={disciplineIndex}
									setDisciplineToDelete={setDisciplineToDelete}
								/>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell className='text-left font-bold'>Всего по модулю:</TableCell>
								<TableCell className='text-right font-bold'>{formatHours(totalModuleHours)}</TableCell>
								{semesterTotals.map((totalHours, i) => (
									<TableCell key={i} className='text-center font-bold border-r last:border-r-0'>
										<p>{totalHours}ч</p>
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
					onOpenChange={(isOpen) => !isOpen && setDisciplineToDelete(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
							<AlertDialogDescription>
								Вы точно хотите удалить дисциплину{' '}
								<span className='font-medium'>
									{disciplineToDelete !== null && (disciplines?.[disciplineToDelete]?.code || '')}
								</span>
								?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Отмена</AlertDialogCancel>
							<AlertDialogAction onClick={() => disciplineToDelete !== null && remove(disciplineToDelete)}>
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
	const watchedSemesters = useWatch({
		control: form.control,
		name: `disciplines.${disciplineIndex}.semesters` as Path<T>,
	}) as Discipline['semesters']

	const totalHours = watchedSemesters?.reduce((acc, sem) => acc + (sem.hours || 0), 0) || 0

	useEffect(() => {
		// Update the form state silently so it's available on submission
		if (form.getValues(`disciplines.${disciplineIndex}.totalHours` as Path<T>) !== totalHours) {
			form.setValue(`disciplines.${disciplineIndex}.totalHours` as Path<T>, totalHours as PathValue<T, Path<T>>, {
				shouldValidate: true,
				shouldDirty: true,
			})
		}
	}, [totalHours, disciplineIndex, form])

	return (
		<TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
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
									<Input placeholder='Название дисциплины' {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
				</div>
			</TableCell>
			<TableCell className='align-middle text-center w-24 font-medium'>
				<p>{formatHours(totalHours)}</p>
			</TableCell>
			{Array.from({ length: 8 }).map((_, semesterIndex) => (
				<EditableHourCell
					key={semesterIndex}
					fieldName={`disciplines.${disciplineIndex}.semesters.${semesterIndex}.hours` as Path<T>}
					form={form}
				/>
			))}
		</TableRow>
	)
}
