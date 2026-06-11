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
} from '@shadcn'
import { useLocaleStore } from '@store'

import localeDictionary from './locale.json'

interface IDeleteAlertProps {
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	onDelete: () => void
}

export const DeleteAlert = ({ isOpen, onOpenChange, onDelete }: IDeleteAlertProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).deleteAlert

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t.title}</AlertDialogTitle>
					<AlertDialogDescription>{t.description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t.cancel}</AlertDialogCancel>
					<AlertDialogAction variant='destructive' onClick={onDelete}>
						{t.delete}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
