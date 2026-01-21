'use client'

import { AiGenerateButton } from '@components'
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
} from '@ui'
import { type FieldValues, type Path, type PathValue, useFormContext } from 'react-hook-form'

interface IProps<T extends FieldValues> {
	name: Path<T>
	title: string
	description: string
	label: string
	placeholder: string
	rows?: number
	aiType?: 'annotation' | 'goals' // Based on your AiGenerateButton requirements
}

export function NoteEdit<T extends FieldValues>({
	name,
	title,
	description,
	label,
	placeholder,
	rows = 8,
	aiType = 'annotation',
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

								<AiGenerateButton
									defaultType={aiType}
									onGenerated={(t) => form.setValue(name, t as PathValue<T, Path<T>>, { shouldDirty: true })}
								/>
							</div>
							<FormControl>
								<Textarea className='h-full' placeholder={placeholder} rows={rows} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
