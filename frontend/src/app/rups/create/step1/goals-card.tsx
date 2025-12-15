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
import type { UseFormReturn } from 'react-hook-form'

import type { FormData } from './step1'

interface GoalsCardProps {
	form: UseFormReturn<FormData>
}

export function GoalsCard({ form }: GoalsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Цели и задачи</CardTitle>
				<CardDescription>Введите цели, задачи и навыки которые должны быть освоены</CardDescription>
			</CardHeader>
			<CardContent className='space-y-2'>
				<FormField
					control={form.control}
					name='goals'
					render={({ field }) => (
						<FormItem>
							<div className='flex justify-between items-end'>
								<span className='text-xs'>Цель и задачи</span>
								<AiGenerateButton defaultType='goals' onGenerated={(t) => form.setValue('goals', t)} />
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
