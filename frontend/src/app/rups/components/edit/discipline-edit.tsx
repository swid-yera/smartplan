'use client'

import { useEffect, useState } from 'react'

import { EditableHourCell } from '@components'
import { formatAsDash, getLocaleText, getUILocaleSection } from '@helpers'
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
import { useLocaleStore } from '@store'
import { type Locale, type LocaleText, RupTypeEnum } from '@types'
import { Plus, Trash } from 'lucide-react'
import {
	type ArrayPath,
	type FieldValues,
	type Path,
	type PathValue,
	useFieldArray,
	useFormContext,
	useWatch,
} from 'react-hook-form'

import localeDictionary from './locale.json'

type Semester = { semester: number; totalHours: number }

type Discipline = {
	name: LocaleText
	type: RupTypeEnum
	totalHours: number
	semesters: Semester[]
}

type IProps = FieldValues & {
	disciplines: Discipline[]
}

const getRawLocalizedValue = (value: LocaleText, locale: Locale) => {
	if (!value || typeof value !== 'object') return ''

	return locale === 'kk' ? (value.kz ?? '') : (value.ru ?? '')
}

const updateRawLocaleText = (value: LocaleText, locale: Locale, next: string): LocaleText => ({
	...value,
	[locale === 'kk' ? 'kz' : 'ru']: next,
})

export function DisciplineEdit<T extends IProps>({ activeLocale }: { activeLocale: Locale }) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const form = useFormContext<T>()
	const { control } = form
	const rupType = useWatch({ control, name: 'type' as Path<T> }) as RupTypeEnum | undefined

	const {
		fields: disciplineFields,
		append,
		remove,
	} = useFieldArray({
		control,
		name: 'disciplines' as ArrayPath<T>,
	})

	const [disciplineToDelete, setDisciplineToDelete] = useState<number | null>(null)

	const disciplineNamePaths = disciplineFields.map((_, index) => `disciplines.${index}.name` as Path<T>)
	const disciplineSemesterPaths = disciplineFields.map((_, index) => `disciplines.${index}.semesters` as Path<T>)

	const disciplineNames = (useWatch({ control, name: disciplineNamePaths }) as LocaleText[] | undefined) ?? []
	const disciplineSemesters =
		(useWatch({ control, name: disciplineSemesterPaths }) as Discipline['semesters'][] | undefined) ?? []

	const newDiscipline = {
		name: { ru: '', kz: '' },
		type: rupType ?? RupTypeEnum.THEORY,
		totalHours: 0,
		semesters: Array.from({ length: 8 }, (_, i) => ({
			semester: i + 1,
			totalHours: 0,
		})),
		topics: [],
	}

	// result
	const totalModuleHours =
		disciplineSemesters?.reduce((acc, semesters) => {
			const disciplineSum = semesters?.reduce((sum, s) => sum + (Number(s.totalHours) || 0), 0) || 0

			return acc + disciplineSum
		}, 0) || 0

	const semesterTotals = Array(8).fill(0)

	disciplineSemesters?.forEach((semesters) => {
		semesters?.forEach((semester, i) => {
			if (i < 8) {
				semesterTotals[i] += Number(semester.totalHours) || 0
			}
		})
	})

	return (
		<Card>
			<CardHeader className='flex justify-between items-start'>
				<div>
					<CardTitle>{t.disciplineTitle}</CardTitle>
					<CardDescription>{t.disciplineDescription}</CardDescription>
				</div>

				<Button type='button' variant='outline' onClick={() => append(newDiscipline as PathValue<T, ArrayPath<T>>)}>
					<Plus /> {t.discipline.add}
				</Button>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-full min-w-100' rowSpan={3}>
									{t.discipline.tableDiscipline}:
								</TableHead>
								<TableHead className='text-center wrap-break-words whitespace-normal' rowSpan={3}>
									{t.discipline.tableTotal}
								</TableHead>
								<TableHead className='text-center' colSpan={8}>
									{t.discipline.tableBySemesters}
								</TableHead>
							</TableRow>
							<TableRow>
								{Array.from({ length: 4 }, (_, i) => (
									<TableHead key={i} className='text-center border-r' colSpan={2}>
										{i + 1} {t.discipline.courseSuffix}
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
							<ModuleRow activeLocale={activeLocale} />
							{disciplineFields.length > 0 ? (
								<>
									{disciplineFields.map((field, index) => (
										<DisciplineRow
											key={field.id}
											activeLocale={activeLocale}
											disciplineIndex={index}
											namePlaceholder={t.discipline.namePlaceholder}
											setDisciplineToDelete={setDisciplineToDelete}
										/>
									))}
								</>
							) : (
								<TableRow>
									<TableCell className='h-28 text-center text-muted-foreground' colSpan={10}>
										{t.discipline.empty}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell className='w-full font-bold'>{t.discipline.total}:</TableCell>
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
							<AlertDialogTitle>{t.discipline.confirmTitle}</AlertDialogTitle>
							<AlertDialogDescription>
								{disciplineToDelete !== null
									? t.discipline.confirmDescription.replace(
											'{name}',
											getLocaleText(disciplineNames?.[disciplineToDelete], activeLocale),
										)
									: ''}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{t.discipline.cancel}</AlertDialogCancel>
							<AlertDialogAction
								className='bg-destructive'
								onClick={() => {
									if (disciplineToDelete !== null) {
										remove(disciplineToDelete)
										setDisciplineToDelete(null)
									}
								}}
							>
								{t.discipline.delete}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	)
}

function ModuleRow<T extends IProps>({ activeLocale }: { activeLocale: Locale }) {
	const form = useFormContext<T>()

	const watchedRupName = form.watch('name' as Path<T>) as LocaleText

	return (
		<TableRow className='[&>:not(:last-child)]:border-r h-16'>
			<TableCell className='w-full wrap-break-words whitespace-normal'>
				{getLocaleText(watchedRupName, activeLocale)}
			</TableCell>
			<TableCell className='text-center font-medium' />
			{Array.from({ length: 8 }).map((_, semesterIndex) => (
				<TableCell key={semesterIndex} className='text-center font-medium' />
			))}
		</TableRow>
	)
}

function DisciplineRow<T extends IProps>({
	disciplineIndex,
	activeLocale,
	namePlaceholder,
	setDisciplineToDelete,
}: {
	disciplineIndex: number
	activeLocale: Locale
	namePlaceholder: string
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
										<Input
											placeholder={namePlaceholder}
											value={getRawLocalizedValue(field.value as LocaleText, activeLocale)}
											onChange={(event) =>
												field.onChange(
													updateRawLocaleText(field.value as LocaleText, activeLocale, event.target.value),
												)
											}
										/>
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
