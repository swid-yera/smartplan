'use client'

import type { ReactNode } from 'react'

import { getUILocaleSection } from '@helpers'
import { cn } from '@lib'
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { Locale } from '@types'
import { LinkIcon, Plus, Trash } from 'lucide-react'

import type { IResourceRow } from './lesson-edit.types'
import localeDictionary from './locale.json'

type IProps = {
	activeLocale: Locale
	description: string
	icon?: ReactNode
	items: IResourceRow[]
	onAdd: () => void
	onChange: (index: number, field: 'name' | 'link', value: string) => void
	onRemove: (index: number) => void
	title: string
}

export function ResourceEditor({ activeLocale, description, icon, items, onAdd, onChange, onRemove, title }: IProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<Card>
			<CardHeader>
				<CardTitle className='inline-flex items-center gap-2'>
					{icon}
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className='flex h-full flex-col justify-between gap-4 text-sm'>
				<div className='flex flex-col gap-2'>
					<Label className='inline-flex items-center gap-2'>
						<LinkIcon className='h-4 w-4 text-primary' />
						{t.resources}
					</Label>
					<ol className='flex list-none flex-col gap-2'>
						{items.map((item, index) => {
							const hasLink = Boolean(item.link.trim())

							return (
								<li key={item.id || `${title}-${index}`} className='flex items-start gap-2'>
									<div className='w-4 pt-2 text-xs text-muted-foreground'>{index + 1}.</div>
									<Input
										className='flex-1'
										placeholder={t.resourceNamePlaceholder}
										value={item.name[activeLocale]}
										onChange={(e) => onChange(index, 'name', e.target.value)}
									/>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												className={cn(hasLink && 'bg-secondary')}
												size='icon'
												type='button'
												variant={hasLink ? 'default' : 'outline'}
											>
												<LinkIcon className='h-4 w-4' />
											</Button>
										</PopoverTrigger>
										<PopoverContent className='w-80'>
											<div className='flex flex-col gap-4'>
												<div className='flex flex-col gap-2'>
													<h4 className='font-medium leading-none'>{t.addLink}</h4>
													<p className='text-sm text-muted-foreground'>{t.addLinkDescription}</p>
												</div>
												<Input
													placeholder='https://example.com'
													value={item.link}
													onChange={(e) => onChange(index, 'link', e.target.value)}
												/>
											</div>
										</PopoverContent>
									</Popover>
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
												<AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
												<AlertDialogDescription>
													{t.deleteResourceDescription}
													<strong className='ml-1 text-foreground'>
														{item.name[activeLocale] || `№${index + 1}`}
													</strong>
													.
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
								</li>
							)
						})}
					</ol>
				</div>
				<Button size='sm' type='button' variant='outline' onClick={onAdd}>
					<Plus className='mr-2 h-4 w-4' />
					{t.addResource}
				</Button>
			</CardContent>
		</Card>
	)
}
