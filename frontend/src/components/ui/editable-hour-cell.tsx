'use client'

import { useRef, useState } from 'react'

import { formatAsDash, getHoursStyle } from '@helpers'
import { cn } from '@lib'
import { Button, FormControl, FormField, FormItem, FormMessage, Input, TableCell } from '@shadcn'
import { type FieldPath, type FieldValues, type UseFormReturn, useWatch } from 'react-hook-form'

function EditableHourCell<TFieldValues extends FieldValues>({
	form,
	fieldName,
}: {
	form: UseFormReturn<TFieldValues>
	fieldName: FieldPath<TFieldValues>
}) {
	const [isEditing, setIsEditing] = useState(false)
	const [draftValue, setDraftValue] = useState('')
	const skipCommitRef = useRef(false)
	const hours = useWatch({ control: form.control, name: fieldName })

	const startEditing = () => {
		skipCommitRef.current = false
		setDraftValue(String(hours ?? 0))
		setIsEditing(true)
	}

	const normalizeDraftValue = (value: string) => {
		const parsed = parseInt(value, 10)

		return Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
	}

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
									inputMode='numeric'
									placeholder='0'
									type='text'
									{...field}
									value={draftValue}
									onBlur={() => {
										field.onBlur()
										if (skipCommitRef.current) {
											skipCommitRef.current = false
											return
										}
										field.onChange(normalizeDraftValue(draftValue))
										setIsEditing(false)
									}}
									onFocus={(event) => event.currentTarget.select()}
									onChange={(e) => {
										setDraftValue(e.target.value.replace(/\D/g, ''))
									}}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault()
											field.onChange(normalizeDraftValue(draftValue))
											setIsEditing(false)
											return
										}

										if (event.key === 'Escape') {
											event.preventDefault()
											skipCommitRef.current = true
											setIsEditing(false)
										}
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
					onClick={startEditing}
				>
					{formatAsDash(hours)}
				</Button>
			</div>
		</TableCell>
	)
}

export { EditableHourCell }
