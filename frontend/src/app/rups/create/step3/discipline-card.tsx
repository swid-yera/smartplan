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
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { Info, Trash } from 'lucide-react'
import { type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form'

import { formatCredits, formatHours } from '@/helpers'

import type { FormData } from './step3'

interface IProps {
	form: UseFormReturn<FormData>
}

export function DisciplineCard({ form }: IProps) {
	const {
		fields: disciplineFields,
		append,
		remove,
	} = useFieldArray({
		control: form.control,
		name: 'disciplines',
	})

	const [disciplineToDelete, setDisciplineToDelete] = useState<number | null>(null)

	const disciplines = useWatch({
		control: form.control,
		name: 'disciplines',
	})

	const newDiscipline = {
		code: '',
		name: '',
		totalCredits: 0,
		semesters: Array.from({ length: 8 }, (_, i) => ({
			semester: i + 1,
			credits: 0,
		})),
	}

	const semesterTotals = Array(8).fill(0)

	disciplines.forEach((discipline) => {
		discipline.semesters.forEach((semester, i) => {
			semesterTotals[i] += semester.credits || 0
		})
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					Распределение часов по семестру, создание разделов/дисциплин учебной рабочей программы
				</CardTitle>
				<CardDescription>
					Распределение часов по семестру используя кредиты , создание разделов/дисциплин и высчитывания общее
					количество часов в учебном плане
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className='text-sm text-primary text-balance mt-2'>
					<Info className='inline mr-2' />
					Часы по семестрам считаются в кредитах, 1 кредит = 24 часа
					<br />- Каждая дисциплина должна иметь минимум один семестр
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
									form={form}
									setDisciplineToDelete={setDisciplineToDelete}
								/>
							))}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell className='text-left font-bold'>Всего по модулю:</TableCell>
								<TableCell className='text-right font-bold'>
									{(() => {
										const disciplinesCredits = disciplines
											.map((discipline) => discipline.totalCredits)
											.reduce((a, b) => a + b, 0)

										return `${formatCredits(disciplinesCredits)} = ${formatHours(disciplinesCredits * 24)} `
									})()}
								</TableCell>
								{semesterTotals.map((totalCredits, i) => (
									<TableCell key={i} className='text-center font-bold border-r last:border-r-0'>
										<p>
											{totalCredits} = {totalCredits * 24}ч
										</p>
									</TableCell>
								))}
							</TableRow>
						</TableFooter>
					</Table>
				</div>
				<Button className='mt-4' type='button' variant='outline' onClick={() => append(newDiscipline)}>
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
									{disciplineToDelete !== null && (disciplines[disciplineToDelete]?.code || '')}
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

function DisciplineRow({
	form,
	disciplineIndex,
	setDisciplineToDelete,
}: {
	form: UseFormReturn<FormData>
	disciplineIndex: number
	setDisciplineToDelete: (index: number | null) => void
}) {
	const watchedSemesters = useWatch({
		control: form.control,
		name: `disciplines.${disciplineIndex}.semesters`,
	})

	const totalCredits = watchedSemesters.reduce((acc, sem) => acc + (sem.credits || 0), 0)

	useEffect(() => {
		// Update the form state silently so it's available on submission
		if (form.getValues(`disciplines.${disciplineIndex}.totalCredits`) !== totalCredits) {
			form.setValue(`disciplines.${disciplineIndex}.totalCredits`, totalCredits, {
				shouldValidate: true,
				shouldDirty: true,
			})
		}
	}, [totalCredits, disciplineIndex, form])

	return (
		<TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
			<TableCell>
				<div className='space-y-2'>
					<div className='flex items-start gap-2'>
						<div className='grow'>
							<FormField
								control={form.control}
								name={`disciplines.${disciplineIndex}.code`}
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input placeholder='Код' {...field} />
										</FormControl>
										<FormMessage />
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
						name={`disciplines.${disciplineIndex}.name`}
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input placeholder='Название' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</TableCell>
			<TableCell className='align-middle text-center'>
				{/* Displaying as text instead of an input */}
				<p className='w-24 mx-auto font-medium'>{formatCredits(totalCredits)}</p>
			</TableCell>
			{Array.from({ length: 8 }).map((_, semesterIndex) => (
				<TableCell key={semesterIndex} className='align-top text-center'>
					<FormField
						control={form.control}
						name={`disciplines.${disciplineIndex}.semesters.${semesterIndex}.credits`}
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										className='w-16 mx-auto'
										min='0'
										placeholder='0'
										type='number'
										{...field}
										onChange={(e) => field.onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</TableCell>
			))}
		</TableRow>
	)
}
