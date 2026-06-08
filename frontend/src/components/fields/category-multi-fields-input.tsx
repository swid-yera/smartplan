'use client'

import { getLocaleText, interpolateUILocaleText } from '@helpers'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ICategoryFieldResponse, ICategoryMultiFieldOptionResponse, ICategoryMultiFieldRowValue } from '@types'
import { Plus, Trash2 } from 'lucide-react'

import { CategoryFieldInput } from './category-field-input'
import {
	type ICategoryFieldValue,
	capitalizeFirstLetter,
	createEmptyMultiFieldRow,
	isMultiFieldRowArray,
} from './category-fields.utils'
import localeDictionary from './locale.json'

type CategoryMultiFieldsInputProps = {
	field: ICategoryFieldResponse
	value: ICategoryFieldValue | undefined
	onChange: (fieldKey: string, nextValue: ICategoryFieldValue) => void
}

const isCategoryFieldResponse = (value: unknown): value is ICategoryMultiFieldOptionResponse => {
	return typeof value === 'object' && value !== null && 'key' in value && 'type' in value && 'label' in value
}

export const CategoryMultiFieldsInput = ({ field, value, onChange }: CategoryMultiFieldsInputProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = localeDictionary[locale] ?? localeDictionary.ru
	const subFields = Array.isArray(field.options) ? field.options.filter(isCategoryFieldResponse) : []
	const rows = isMultiFieldRowArray(value) ? value : []
	const fieldLabel = capitalizeFirstLetter(getLocaleText(field.label, locale) || field.key)
	const helpText = getLocaleText(field.helpText, locale)

	const addRow = () => {
		onChange(field.key, [...rows, createEmptyMultiFieldRow(subFields)])
	}

	const removeRow = (rowIndex: number) => {
		onChange(
			field.key,
			rows
				.filter((_, currentIndex) => currentIndex !== rowIndex)
				.map((row) => ({ ...row })) as ICategoryMultiFieldRowValue[],
		)
	}

	const updateRowValue = (rowIndex: number, childKey: string, nextValue: string | number) => {
		const nextRows = rows.map((row, currentIndex) => {
			if (currentIndex !== rowIndex) return row

			return {
				...row,
				[childKey]: nextValue,
			}
		})

		onChange(field.key, nextRows)
	}

	return (
		<div className='space-y-3 rounded-md border p-4'>
			<div className='flex items-start justify-between gap-3'>
				<div className='space-y-1'>
					<p className='text-sm font-semibold'>
						{fieldLabel}
						{field.required ? ' *' : ''}
					</p>
					{helpText ? <p className='text-xs text-muted-foreground'>{helpText}</p> : null}
				</div>

				<Button size='sm' type='button' variant='outline' onClick={addRow}>
					<Plus className='mr-2 h-4 w-4' />
					{t.multiFieldsAddRow}
				</Button>
			</div>

			{subFields.length ? (
				<div className='space-y-4'>
					{rows.map((row, rowIndex) => (
						<Card key={`${field.key}-${rowIndex}`} className='border-dashed'>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
								<CardTitle className='text-sm font-medium'>
									{interpolateUILocaleText(t.multiFieldsRowTitle, { index: rowIndex + 1 })}
								</CardTitle>
								<Button size='icon' type='button' variant='ghost' onClick={() => removeRow(rowIndex)}>
									<Trash2 className='h-4 w-4' />
								</Button>
							</CardHeader>

							<CardContent>
								<div className='grid gap-4 md:grid-cols-2'>
									{subFields.map((childField) => (
										<div key={`${field.key}-${rowIndex}-${childField.key}`}>
											<CategoryFieldInput
												field={childField as unknown as ICategoryFieldResponse}
												value={
													typeof row[childField.key] === 'number'
														? String(row[childField.key])
														: row[childField.key]
												}
												onChange={(_, nextValue) =>
													updateRowValue(rowIndex, childField.key, String(nextValue))
												}
											/>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}

					{rows.length === 0 ? (
						<div className='rounded-md border border-dashed p-3 text-sm text-muted-foreground'>
							{t.multiFieldsEmpty}
						</div>
					) : null}
				</div>
			) : (
				<div className='rounded-md border border-dashed p-3 text-sm text-muted-foreground'>
					{t.multiFieldsNoSubFields}
				</div>
			)}
		</div>
	)
}
