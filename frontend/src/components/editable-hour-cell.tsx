'use client'

import { useState } from 'react'

import { getHoursStyle } from '@helpers'
import { cn } from '@lib'
import { Button, FormControl, FormField, FormItem, FormMessage, Input, TableCell } from '@ui'
import { type FieldPath, type FieldValues, type UseFormReturn, useWatch } from 'react-hook-form'

function EditableHourCell<TFieldValues extends FieldValues>({
	form,
	fieldName,
}: {
	form: UseFormReturn<TFieldValues>
	fieldName: FieldPath<TFieldValues>
}) {
	const [isEditing, setIsEditing] = useState(false)
	const hours = useWatch({ control: form.control, name: fieldName })

	if (isEditing) {
		return (
			<TableCell className='align-middle'>
				<FormField
					control={form.control}
					name={fieldName}
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Input
									autoFocus
									className='w-16 mx-auto text-center'
									min='0'
									placeholder='0'
									type='text'
									{...field}
									value={field.value ?? 0}
									onBlur={() => {
										field.onBlur()
										setIsEditing(false)
									}}
									onChange={(e) => {
										const value = parseInt(e.target.value, 10)
										const newValue = isNaN(value) ? 0 : Math.max(0, value)

										field.onChange(newValue)
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</TableCell>
		)
	}

	return (
		<TableCell className='align-middle'>
			<div className='flex justify-center'>
				<Button
					className={cn('w-16 h-auto py-2 mx-auto', getHoursStyle(hours))}
					size='sm'
					type='button'
					variant='ghost'
					onClick={() => setIsEditing(true)}
				>
					{hours || '—'}
				</Button>
			</div>
		</TableCell>
	)
}

export { EditableHourCell }
