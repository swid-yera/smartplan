'use client'

import type { Dispatch, SetStateAction } from 'react'

import { normalizeTopicType } from '@helpers'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { TopicTypeEnum } from '@types'

import type { IRegenerateFormData } from './lesson-page.types'

type IDeleteDialogProps = {
	isOpen: boolean
	onConfirm: () => void
	onOpenChange: Dispatch<SetStateAction<boolean>>
}

type IRegenerateDialogProps = {
	canRegenerate: boolean
	formData: IRegenerateFormData
	isOpen: boolean
	isPending: boolean
	onConfirm: () => void
	onNumberChange: (value: string) => number
	onOpenChange: Dispatch<SetStateAction<boolean>>
	onUpdate: Dispatch<SetStateAction<IRegenerateFormData>>
}

export function LessonDeleteDialog({ isOpen, onConfirm, onOpenChange }: IDeleteDialogProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Удалить урок?</AlertDialogTitle>
					<AlertDialogDescription>
						Это действие нельзя отменить. Урок будет удален без возможности восстановления.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Отмена</AlertDialogCancel>
					<AlertDialogAction variant='destructive' onClick={onConfirm}>
						Удалить
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export function LessonRegenerateDialog({
	canRegenerate,
	formData,
	isOpen,
	isPending,
	onConfirm,
	onNumberChange,
	onOpenChange,
	onUpdate,
}: IRegenerateDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Данные темы</DialogTitle>
					<DialogDescription>Измените данные и запустите перегенерацию урока.</DialogDescription>
				</DialogHeader>

				<div className='grid gap-4'>
					<div className='grid gap-2'>
						<Label htmlFor='lesson-topic-name'>Название</Label>
						<Input
							id='lesson-topic-name'
							value={formData.name}
							onChange={(e) => onUpdate((prev) => ({ ...prev, name: e.target.value }))}
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='lesson-topic-theory'>Теория</Label>
							<Input
								id='lesson-topic-theory'
								min={0}
								type='number'
								value={formData.theoryHours}
								onChange={(e) => onUpdate((prev) => ({ ...prev, theoryHours: onNumberChange(e.target.value) }))}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='lesson-topic-practice'>Практика</Label>
							<Input
								id='lesson-topic-practice'
								min={0}
								type='number'
								value={formData.practiceHours}
								onChange={(e) =>
									onUpdate((prev) => ({ ...prev, practiceHours: onNumberChange(e.target.value) }))
								}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='lesson-topic-individual'>Индивидуальная</Label>
							<Input
								id='lesson-topic-individual'
								min={0}
								type='number'
								value={formData.individualHours}
								onChange={(e) =>
									onUpdate((prev) => ({ ...prev, individualHours: onNumberChange(e.target.value) }))
								}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='lesson-topic-srsp'>СРСП</Label>
							<Input
								id='lesson-topic-srsp'
								min={0}
								type='number'
								value={formData.srspHours}
								onChange={(e) => onUpdate((prev) => ({ ...prev, srspHours: onNumberChange(e.target.value) }))}
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='lesson-topic-srs'>СРС</Label>
							<Input
								id='lesson-topic-srs'
								min={0}
								type='number'
								value={formData.srsHours}
								onChange={(e) => onUpdate((prev) => ({ ...prev, srsHours: onNumberChange(e.target.value) }))}
							/>
						</div>
						<div className='grid gap-2'>
							<Label>Тип</Label>
							<Select
								value={formData.type}
								onValueChange={(value) => onUpdate((prev) => ({ ...prev, type: value as TopicTypeEnum }))}
							>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Выберите тип' />
								</SelectTrigger>
								<SelectContent>
									{Object.values(TopicTypeEnum).map((topicType) => (
										<SelectItem key={topicType} value={topicType}>
											{normalizeTopicType(topicType)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						Отмена
					</Button>
					<Button disabled={!canRegenerate || isPending} onClick={onConfirm}>
						Перегенерировать
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
