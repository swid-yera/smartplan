'use client'

import type { Dispatch, SetStateAction } from 'react'

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
} from '@shadcn'
import { useLocaleStore } from '@store'

import { RegenerateDescriptionDialog } from '../../dialogs/regenerate-description-dialog'
import localeDictionary from './locale.json'

type IDeleteDialogProps = {
	isOpen: boolean
	onConfirm: () => void
	onOpenChange: Dispatch<SetStateAction<boolean>>
}

type IRegenerateDialogProps = {
	canRegenerate: boolean
	description: string
	eventDate?: Date
	isOpen: boolean
	isPending: boolean
	onConfirm: () => void
	onDescriptionChange: (value: string) => void
	onEventDateChange: (value: Date | undefined) => void
	onOpenChange: Dispatch<SetStateAction<boolean>>
}

export function LessonDeleteDialog({ isOpen, onConfirm, onOpenChange }: IDeleteDialogProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t.deleteLessonTitle}</AlertDialogTitle>
					<AlertDialogDescription>{t.deleteLessonDescription}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t.cancel}</AlertDialogCancel>
					<AlertDialogAction variant='destructive' onClick={onConfirm}>
						{t.delete}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export function LessonRegenerateDialog({
	canRegenerate,
	description,
	eventDate,
	isOpen,
	isPending,
	onConfirm,
	onDescriptionChange,
	onEventDateChange,
	onOpenChange,
}: IRegenerateDialogProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<RegenerateDescriptionDialog
			cancelLabel={t.cancel}
			confirmLabel={t.regenerate}
			description={description}
			descriptionId='lesson-regenerate-description'
			descriptionLabel={t.description}
			descriptionPlaceholder={t.regeneratePlaceholder}
			dialogDescription={t.regenerateDialogDescription}
			eventDate={eventDate}
			eventDateLabel={t.eventDateLabel}
			eventDatePlaceholder={t.eventDatePlaceholder}
			isConfirmDisabled={!canRegenerate || description.trim().length === 0 || !eventDate}
			isOpen={isOpen}
			isPending={isPending}
			title={t.regenerateLessonTitle}
			onConfirm={onConfirm}
			onDescriptionChange={onDescriptionChange}
			onEventDateChange={onEventDateChange}
			onOpenChange={onOpenChange}
		/>
	)
}
