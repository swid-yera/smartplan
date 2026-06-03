'use client'

import { getUILocaleSection } from '@helpers'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
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
import { Plus, Trash, Waypoints } from 'lucide-react'

import type { ILessonProgressRow } from './lesson-edit.types'
import localeDictionary from './locale.json'

type IProps = {
	activeLocale: 'ru' | 'kk'
	items: ILessonProgressRow[]
	onAdd: () => void
	onChange: (
		index: number,
		field: 'name' | 'firstTime' | 'secondTime' | 'thirdTime' | 'contentText',
		value: string,
	) => void
	onRemove: (index: number) => void
}

export function LessonProgressEditor({ activeLocale, items, onAdd, onChange, onRemove }: IProps) {
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
							<div className='grid gap-3 md:grid-cols-[1fr_110px_110px_110px_auto] md:items-end'>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-name-${index}`}>
										{t.progressStage} {index + 1}
									</Label>
									<Input
										id={`lesson-progress-name-${index}`}
										placeholder={t.progressStagePlaceholder}
										value={item.name[activeLocale]}
										onChange={(e) => onChange(index, 'name', e.target.value)}
									/>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-start-${index}`}>{t.progressVariant1}</Label>
									<Input
										id={`lesson-progress-start-${index}`}
										min={0}
										type='number'
										value={item.firstTime}
										onChange={(e) => onChange(index, 'firstTime', e.target.value)}
									/>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-end-${index}`}>{t.progressVariant2}</Label>
									<Input
										id={`lesson-progress-end-${index}`}
										min={0}
										type='number'
										value={item.secondTime}
										onChange={(e) => onChange(index, 'secondTime', e.target.value)}
									/>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor={`lesson-progress-third-${index}`}>{t.progressVariant3}</Label>
									<Input
										id={`lesson-progress-third-${index}`}
										min={0}
										type='number'
										value={item.thirdTime}
										onChange={(e) => onChange(index, 'thirdTime', e.target.value)}
									/>
								</div>
								<div className='flex justify-end md:pb-1'>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className='text-destructive hover:bg-destructive/10'
												size='icon'
												type='button'
												variant='outline'
											>
												<Trash className='h-4 w-4' />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>{t.deleteProgressTitle}</AlertDialogTitle>
												<AlertDialogDescription>
													{t.deleteProgressDescription}
													<strong className='ml-1 text-foreground'>
														{item.name[activeLocale] || `№${index + 1}`}
													</strong>
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>{t.cancel}</AlertDialogCancel>
												<AlertDialogAction
													className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
													onClick={() => onRemove(index)}
												>
													{t.delete}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>

							<div className='mt-3 grid gap-2'>
								<Label htmlFor={`lesson-progress-content-${index}`}>{t.progressContent}</Label>
								<Textarea
									className='min-h-48'
									id={`lesson-progress-content-${index}`}
									placeholder={t.progressContentPlaceholder}
									value={item.contentText}
									onChange={(e) => onChange(index, 'contentText', e.target.value)}
								/>
							</div>
						</div>
					))}
				</div>
				<Button size='sm' type='button' variant='outline' onClick={onAdd}>
					<Plus className='mr-2 h-4 w-4' />
					{t.addProgress}
				</Button>
			</CardContent>
		</Card>
	)
}
