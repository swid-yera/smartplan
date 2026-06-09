'use client'

import { getUILocaleSection } from '@helpers'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Textarea,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { Waypoints } from 'lucide-react'

import type { ILessonProgressRow } from './lesson-edit.types'
import localeDictionary from './locale.json'

type IProps = {
	activeLocale: 'ru' | 'kk'
	items: ILessonProgressRow[]
	onChange: (index: number, field: 'contentText', value: string) => void
}

export function LessonProgressEditor({ activeLocale, items, onChange }: IProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<Card>
			<CardHeader>
				<CardTitle className='inline-flex items-center gap-2'>
					<Waypoints className='h-4 w-4 text-primary' />
					{t.progressTitle}
				</CardTitle>
				<CardDescription>{t.progressDescription}</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='space-y-3'>
					{items.map((item, index) => (
						<div key={item.id || `lesson-progress-row-${index}`} className='rounded-lg border p-3'>
							<div className='grid gap-3 md:grid-cols-[1fr_110px_110px_110px] md:items-end'>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-name-${index}`}>
										{t.progressStage} {index + 1}
									</Label>
									<Input
										id={`lesson-progress-name-${index}`}
										readOnly
										value={item.name[activeLocale]}
									/>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-start-${index}`}>{t.progressVariant1}</Label>
									<Input
										id={`lesson-progress-start-${index}`}
										readOnly
										type='number'
										value={item.firstTime}
									/>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-end-${index}`}>{t.progressVariant2}</Label>
									<Input
										id={`lesson-progress-end-${index}`}
										readOnly
										type='number'
										value={item.secondTime}
									/>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-third-${index}`}>{t.progressVariant3}</Label>
									<Input
										id={`lesson-progress-third-${index}`}
										readOnly
										type='number'
										value={item.thirdTime}
									/>
								</div>
							</div>

							<div className='mt-3 grid gap-2'>
								<Label htmlFor={`lesson-progress-content-${index}`}>{t.progressContent}</Label>
								<Textarea
									className='min-h-48'
									id={`lesson-progress-content-${index}`}
									placeholder={t.progressContentPlaceholder}
									value={item.contentText[activeLocale]}
									onChange={(e) => onChange(index, 'contentText', e.target.value)}
								/>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
