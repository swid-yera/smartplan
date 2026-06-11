'use client'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
	Textarea,
} from '@shadcn'
import type { Locale, LocaleText } from '@types'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'

import { getLocalizedValue, updateLocaleText } from '../../rup-localization'

interface IProps<T extends FieldValues> {
	name: Path<T>
	activeLocale: Locale
	title: string
	description: string
	label: string
	placeholder: string
	rows?: number
}

export function NoteEdit<T extends FieldValues>({
	name,
	activeLocale,
	title,
	description,
	label,
	placeholder,
	rows = 8,
}: IProps<T>) {
	const form = useFormContext<T>()

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-2 text-sm'>
				<FormField
					control={form.control}
					name={name}
					render={({ field }) => (
						<FormItem>
							<div className='flex items-end justify-between'>
								<span className='text-xs'>{label}</span>
							</div>
							<FormControl>
								<Textarea
									className='h-full'
									placeholder={placeholder}
									rows={rows}
									value={getLocalizedValue(field.value as LocaleText, activeLocale)}
									onChange={(event) =>
										field.onChange(
											updateLocaleText(field.value as LocaleText, activeLocale, event.target.value),
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
