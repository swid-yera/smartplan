'use client'

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Textarea,
} from '@shadcn'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'

interface IProps extends FieldValues {
	goals: string
	tasks: string
	expected: string
}

export function LessonGoalsTasks<T extends IProps>() {
	const { control } = useFormContext<T>()

	const fields: Array<keyof IProps> = ['goals', 'tasks', 'expected']

	return (
		<Card>
			<CardHeader>
				<CardTitle>Цели, задачи и результат</CardTitle>
			</CardHeader>
			<CardContent className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{fields.map((name) => (
					<FormField
						key={name as string}
						control={control}
						name={name as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel className='capitalize'>{name === 'expected' ? 'Результат' : name}</FormLabel>
								<FormControl>
									<Textarea className='min-h-[100px]' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				))}
			</CardContent>
		</Card>
	)
}
