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
	Textarea,
} from '@ui'
import type { UseFormReturn } from 'react-hook-form'

import type { FormData } from './page'

interface ExplorationNoteCardProps {
	form: UseFormReturn<FormData>
}

export function ExplorationNoteCard({ form }: ExplorationNoteCardProps) {
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
					name='explorationNote'
					render={({ field }) => (
						<FormItem>
							<div className='flex items-end justify-between'>
								<span className='text-xs'>Описание</span>

								<AiGenerateButton
									defaultType='annotation'
									onGenerated={(t) => form.setValue('explorationNote', t)}
								/>
							</div>
							<FormControl>
								<Textarea rows={8} {...field} />
							</FormControl>
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
