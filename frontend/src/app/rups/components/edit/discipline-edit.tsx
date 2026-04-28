'use client'

import { useEffect, useState } from 'react'

import { EditableHourCell } from '@components'
import { formatAsDash } from '@helpers'
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
} from '@shadcn'
import { Plus, Trash } from 'lucide-react'
import {
	type ArrayPath,
	type FieldValues,
	type Path,
	type PathValue,
	useFieldArray,
	useFormContext,
} from 'react-hook-form'

type Semester = { semester: number; totalHours: number }

type Discipline = {
	name: string
	totalHours: number
	semesters: Semester[]
}

type IProps = FieldValues & {
	disciplines: Discipline[]
}

export function DisciplineEdit<T extends IProps>() {
	const { control, watch } = useFormContext<T>()

	const {
		fields: disciplineFields,
		append,
		remove,
	} = useFieldArray({
		control,
		name: 'disciplines' as ArrayPath<T>,
	})

	const [disciplineToDelete, setDisciplineToDelete] = useState<number | null>(null)

	const disciplines = watch('disciplines' as Path<T>) as Discipline[]

	const newDiscipline = {
		name: '',
		totalHours: 0,
		semesters: Array.from({ length: 8 }, (_, i) => ({
			semester: i + 1,
			totalHours: 0,
		})),
		topics: [],
	}

	// result
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
			<CardHeader className='flex justify-between items-start'>
				<div>
					<CardTitle>Распределение часов</CardTitle>
					<CardDescription>Создание дисциплин и расчет часов</CardDescription>
				</div>

				<Button type='button' variant='outline' onClick={() => append(newDiscipline as PathValue<T, ArrayPath<T>>)}>
					<Plus /> Добавить дисциплину
				</Button>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-full min-w-[400px]' rowSpan={3}>
									Код и название дисциплины/модуля:
								</TableHead>
								<TableHead className='text-center wrap-break-words whitespace-normal' rowSpan={3}>
									Общее количество часов в модуле
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
										<div className='w-20'>{i + 1}</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							<ModuleRow />
							{disciplineFields.length > 0 ? (
								<>
									{disciplineFields.map((field, index) => (
										<DisciplineRow
											key={field.id}
											disciplineIndex={index}
											setDisciplineToDelete={setDisciplineToDelete}
										/>
									))}
								</>
							) : (
								<TableRow>
									<TableCell className='h-28 text-center text-muted-foreground' colSpan={10}>
										Дисциплины не добавлены.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell className='w-full font-bold'>Всего:</TableCell>
								<TableCell className='text-center font-bold'>{totalModuleHours}</TableCell>
								{semesterTotals.map((total, i) => (
									<TableCell key={i} className='text-center font-bold'>
										{formatAsDash(total)}
									</TableCell>
								))}
							</TableRow>
						</TableFooter>
					</Table>
				</div>

				<AlertDialog
					open={disciplineToDelete !== null}
					onOpenChange={(open) => !open && setDisciplineToDelete(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Подтверждение</AlertDialogTitle>
							<AlertDialogDescription>
								Удалить дисциплину {disciplineToDelete !== null && disciplines?.[disciplineToDelete]?.name}?
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

function ModuleRow<T extends IProps>() {
	const form = useFormContext<T>()

	const watchedRupName = form.watch('name' as Path<T>) as string

	return (
		<TableRow className='[&>:not(:last-child)]:border-r h-16'>
			<TableCell className='w-full wrap-break-words whitespace-normal'>{watchedRupName}</TableCell>
			<TableCell className='text-center font-medium' />
			{Array.from({ length: 8 }).map((_, semesterIndex) => (
				<TableCell key={semesterIndex} className='text-center font-medium' />
			))}
		</TableRow>
	)
}

function DisciplineRow<T extends IProps>({
	disciplineIndex,
	setDisciplineToDelete,
}: {
	disciplineIndex: number
	setDisciplineToDelete: (index: number | null) => void
}) {
	const form = useFormContext<T>()

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
		<TableRow className='[&>:not(:last-child)]:border-r h-16'>
			<TableCell>
				<div className='space-y-2'>
					<div className='flex items-start gap-2 min-w-64'>
						<FormField
							control={form.control}
							name={`disciplines.${disciplineIndex}.name` as Path<T>}
							render={({ field }) => (
								<FormItem className='grow'>
									<FormControl>
										<Input placeholder='Название' {...field} />
									</FormControl>
								</FormItem>
							)}
						/>
						<Button
							size='icon'
							type='button'
							variant='outline'
							onClick={() => setDisciplineToDelete(disciplineIndex)}
						>
							<Trash className='h-4 w-4' />
						</Button>
					</div>
				</div>
			</TableCell>
			<TableCell className='text-center font-medium'>{totalHours}</TableCell>
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
