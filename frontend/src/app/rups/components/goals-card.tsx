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

type GoalsValues = FieldValues & {
	goals?: string
}

export function GoalsCard<T extends GoalsValues>() {
	const form = useFormContext<T>()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Цели и задачи</CardTitle>
				<CardDescription>Введите цели, задачи и навыки которые должны быть освоены</CardDescription>
			</CardHeader>
			<CardContent className='space-y-2'>
				<FormField
					control={form.control}
					name={'goals' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<div className='flex justify-between items-end'>
								<span className='text-xs'>Цель и задачи</span>
								<AiGenerateButton
									defaultType='goals'
									onGenerated={(t) => form.setValue('goals' as Path<T>, t as PathValue<T, Path<T>>)}
								/>
							</div>
							<FormControl>
								<Textarea rows={8} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
