'use client'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@ui'
import { Trash } from 'lucide-react'
import {
	type ArrayPath,
	type FieldValues,
	type Path,
	type PathValue,
	useFieldArray,
	useFormContext,
} from 'react-hook-form'

type ResourceListValues = FieldValues & {
	[key: string]: { value: string }[] | undefined
}

interface ResourceListCardProps<T extends ResourceListValues> {
	name: ArrayPath<T>
	title: string
	description: React.ReactNode
	label: string
	placeholder: string
	buttonText: string
}

export function ResourceListCard<T extends ResourceListValues>({
	name,
	title,
	description,
	label,
	placeholder,
	buttonText,
}: ResourceListCardProps<T>) {
	const { control } = useFormContext<T>()
	const { fields, append, remove } = useFieldArray({
		control,
		name,
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<FormItem>
					<FormLabel>{label}</FormLabel>

					<ol className='space-y-2 list-decimal list-inside'>
						{fields.map((field, index) => (
							<li key={field.id} className='flex items-start gap-2'>
								<div className='pt-2'>{index + 1}.</div>
								<FormField
									control={control}
									name={`${name}.${index}.value` as Path<T>}
									render={({ field }) => (
										<FormItem className='w-full'>
											<FormControl>
												<Input placeholder={placeholder} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button size='icon' type='button' variant='outline' onClick={() => remove(index)}>
									<Trash />
								</Button>
							</li>
						))}
					</ol>

					<Button
						className='mt-2 w-min'
						size='sm'
						type='button'
						variant='outline'
						onClick={() => append({ value: '' } as PathValue<T, ArrayPath<T>>)}
					>
						{buttonText}
					</Button>
				</FormItem>
			</CardContent>
		</Card>
	)
}
