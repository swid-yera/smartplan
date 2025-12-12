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
import type { Control, FieldArrayWithId } from 'react-hook-form'

import type { FormData } from './step2'

interface ResourceListCardProps {
	control: Control<FormData>
	name: 'internetResources' | 'technicalResources'
	title: string
	description: React.ReactNode
	label: string
	placeholder: string
	buttonText: string
	fields: FieldArrayWithId<FormData, 'internetResources' | 'technicalResources'>[]
	append: (value: { value: string }) => void
	remove: (index: number) => void
}

export function ResourceListCard({
	control,
	name,
	title,
	description,
	label,
	placeholder,
	buttonText,
	fields,
	append,
	remove,
}: ResourceListCardProps) {
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
									name={`${name}.${index}.value`}
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
						onClick={() => append({ value: '' })}
					>
						{buttonText}
					</Button>
				</FormItem>
			</CardContent>
		</Card>
	)
}
