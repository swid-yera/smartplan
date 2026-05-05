'use client'

import type { ReactNode } from 'react'

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
import { LinkIcon, Plus, Trash } from 'lucide-react'

import type { IResourceRow } from './lesson-edit.types'

type IProps = {
	description: string
	icon?: ReactNode
	items: IResourceRow[]
	onAdd: () => void
	onChange: (index: number, field: 'name' | 'link', value: string) => void
	onRemove: (index: number) => void
	title: string
}

export function ResourceEditor({ description, icon, items, onAdd, onChange, onRemove, title }: IProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='inline-flex items-center gap-2'>
					{icon}
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className='h-full justify-between flex flex-col gap-4 text-sm'>
				<div className='flex flex-col gap-2'>
					<Label className='inline-flex items-center gap-2'>
						<LinkIcon className='h-4 w-4 text-primary' />
						Ресурсы
					</Label>
					<ol className='flex list-none flex-col gap-2'>
						{items.map((item, index) => {
							const hasLink = Boolean(item.link.trim())

							return (
								<li key={item.id || `${title}-${index}`} className='flex items-start gap-2'>
									<div className='w-4 pt-2 text-xs text-muted-foreground'>{index + 1}.</div>
									<Input
										className='flex-1'
										placeholder='Название ресурса'
										value={item.name}
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
													<h4 className='font-medium leading-none'>Добавить ссылку</h4>
													<p className='text-sm text-muted-foreground'>Вставьте URL-адрес ресурса</p>
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
												<AlertDialogTitle>Вы уверены?</AlertDialogTitle>
												<AlertDialogDescription>
													Это действие удалит ресурс
													<strong className='ml-1 text-foreground'>{item.name || `№${index + 1}`}</strong>.
													Отменить это действие будет невозможно.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Отмена</AlertDialogCancel>
												<AlertDialogAction
													className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
													onClick={() => onRemove(index)}
												>
													Удалить
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
					Добавить ресурс
				</Button>
			</CardContent>
		</Card>
	)
}
