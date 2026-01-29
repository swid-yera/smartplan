'use client'

import { useEffect } from 'react'

import { normalizeLessonMinutes } from '@helpers'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from '@shadcn'
import type { ILessonProgress } from '@types'
import { ListChecks, Plus, Trash2 } from 'lucide-react'
import {
	type ArrayPath,
	type Control,
	type FieldArray,
	type FieldValues,
	type Path,
	useFieldArray,
	useFormContext,
} from 'react-hook-form'

interface IProps extends FieldValues {
	lessonProgress: Omit<ILessonProgress, 'id'>[]
}

export function LessonProgressSection<T extends IProps>() {
	const { control, watch } = useFormContext<T>()
	const progress = watch('lessonProgress' as Path<T>)

	return (
		<Card className='border-primary/20'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<ListChecks className='w-5 h-5' /> Ход занятия
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableCell className='w-8'>№</TableCell>
							<TableCell className='w-96'>Во время занятия</TableCell>
							<TableCell className='w-96'>Описание</TableCell>
						</TableRow>
					</TableHeader>

					<TableBody>
						{progress?.map((field, index) => (
							<ProgressRow
								key={index} // Если у этапа есть id, лучше использовать его
								control={control}
								field={field}
								index={index}
							/>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

// progress row
interface ProgressRowProps<T extends FieldValues> {
	index: number
	control: Control<T>
	field: Omit<ILessonProgress, 'id'>
}

function ProgressRow<T extends FieldValues>({ index, control, field }: ProgressRowProps<T>) {
	const { fields, append, remove } = useFieldArray({
		control,
		name: `lessonProgress.${index}.content` as ArrayPath<T>,
	})

	useEffect(() => {
		if (fields.length === 0) append('' as FieldArray<T, ArrayPath<T>>)
	}, [fields, append])

	return (
		<TableRow className='p-4 rounded-lg align-top'>
			<TableCell className='text-sm font-semibold p-2 w-8'>{index + 1}</TableCell>

			<TableCell className='font-medium text-base border p-2 w-96'>
				<p className='text-base whitespace-break-spaces'>{field.name}</p>
				<p className='text-sm text-muted-foreground'>
					{normalizeLessonMinutes(field.startMinute, field.endMinute)}
				</p>
			</TableCell>

			<TableCell className='p-2 py-10 w-96 relative group'>
				<div className='flex flex-col gap-2'>
					{fields.map((contentField, contentIndex) => (
						<div key={contentField.id} className='flex gap-2 items-center'>
							<Input
								{...control.register(`lessonProgress.${index}.content.${contentIndex}` as Path<T>)}
								className='flex-1'
								placeholder='Введите содержание'
							/>
							<Button
								className='hover:text-destructive hover:bg-destructive/10'
								size='icon'
								type='button'
								variant='ghost'
								onClick={() => remove(contentIndex)}
							>
								<Trash2 className='w-4 h-4' />
							</Button>
						</div>
					))}
					<Button
						className='mt-1 self-end absolute top-0 right-0 opacity-0 group-hover:opacity-100'
						size='icon-sm'
						type='button'
						variant='outline'
						onClick={() => append('' as FieldArray<T, ArrayPath<T>>)}
					>
						<Plus />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	)
}
