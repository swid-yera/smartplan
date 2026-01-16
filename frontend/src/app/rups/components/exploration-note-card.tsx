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

type ExplorationNoteValues = FieldValues & {
	explorationNote?: string
}

export function ExplorationNoteCard<T extends ExplorationNoteValues>() {
	const form = useFormContext<T>()

	return (
		<Card>
			<CardHeader>
				<CardTitle>Пояснительная записка</CardTitle>
				<CardDescription>
					Введите текст раздела рабочей учебной программы (описание модуля, на основе приказа, результаты и другое)
				</CardDescription>
			</CardHeader>

			<CardContent className='space-y-2 text-sm'>
				<FormField
					control={form.control}
					name={'basis' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<div className='flex items-end justify-between'>
								<span className='text-xs'>Описание</span>

								<AiGenerateButton
									defaultType='annotation'
									onGenerated={(t) => form.setValue('basis' as Path<T>, t as PathValue<T, Path<T>>)}
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
