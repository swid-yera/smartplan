'use client'

import type { ICategoryFieldResponse } from '@types'

import { CategoryFieldInput } from './category-field-input'
import type { ICategoryFieldValue, ICategoryFieldValues } from './category-fields.utils'
import { CategoryMultiFieldsInput } from './category-multi-fields-input'

type CategoryFieldsSectionProps = {
	fields: ICategoryFieldResponse[]
	values: ICategoryFieldValues
	onChange: (fieldKey: string, nextValue: ICategoryFieldValue) => void
	title?: string
	emptyText?: string
	columns?: 1 | 2
}

export const CategoryFieldsSection = ({
	fields,
	values,
	onChange,
	title = 'Поля категории',
	emptyText = 'В категории не настроены дополнительные поля',
	columns = 2,
}: CategoryFieldsSectionProps) => {
	return (
		<div className='space-y-3'>
			<h3 className='text-sm font-semibold'>{title}</h3>

			{fields.length ? (
				<div className={`grid gap-4 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
					{fields.map((field) => (
						<div key={field.id} className={field.type === 'multi_fields' ? 'col-span-full' : ''}>
							{field.type === 'multi_fields' ? (
								<CategoryMultiFieldsInput field={field} value={values[field.key]} onChange={onChange} />
							) : (
								<CategoryFieldInput field={field} value={values[field.key]} onChange={onChange} />
							)}
						</div>
					))}
				</div>
			) : (
				<div className='rounded-md border border-dashed p-3 text-sm text-muted-foreground'>{emptyText}</div>
			)}
		</div>
	)
}
