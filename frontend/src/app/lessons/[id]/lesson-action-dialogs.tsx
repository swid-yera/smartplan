'use client'

import type { Dispatch, SetStateAction } from 'react'

import { RegenerateDescriptionDialog } from '@components'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@shadcn'

type IDeleteDialogProps = {
	isOpen: boolean
	onConfirm: () => void
	onOpenChange: Dispatch<SetStateAction<boolean>>
}

type IRegenerateDialogProps = {
	canRegenerate: boolean
	description: string
	isOpen: boolean
	isPending: boolean
	onConfirm: () => void
	onDescriptionChange: (value: string) => void
	onOpenChange: Dispatch<SetStateAction<boolean>>
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
	description,
	isOpen,
	isPending,
	onConfirm,
	onDescriptionChange,
	onOpenChange,
}: IRegenerateDialogProps) {
	return (
		<RegenerateDescriptionDialog
			cancelLabel='Отмена'
			confirmLabel='Перегенерировать'
			description={description}
			descriptionId='lesson-regenerate-description'
			descriptionLabel='Описание'
			descriptionPlaceholder='Опишите, что нужно учесть при перегенерации урока'
			dialogDescription='Укажите описание для перегенерации урока.'
			isConfirmDisabled={!canRegenerate || description.trim().length === 0}
			isOpen={isOpen}
			isPending={isPending}
			title='Перегенерация урока'
			onConfirm={onConfirm}
			onDescriptionChange={onDescriptionChange}
			onOpenChange={onOpenChange}
		/>
	)
}
