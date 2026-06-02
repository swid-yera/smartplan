'use client'

import { type FC } from 'react'

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Textarea,
} from '@shadcn'

interface IRegenerateDescriptionDialogProps {
	cancelLabel: string
	confirmLabel: string
	description: string
	descriptionLabel: string
	descriptionPlaceholder: string
	descriptionId?: string
	dialogDescription: string
	isConfirmDisabled?: boolean
	isOpen: boolean
	isPending?: boolean
	onConfirm: () => void
	onDescriptionChange: (value: string) => void
	onOpenChange: (open: boolean) => void
	title: string
}

export const RegenerateDescriptionDialog: FC<IRegenerateDescriptionDialogProps> = ({
	cancelLabel,
	confirmLabel,
	description,
	descriptionLabel,
	descriptionPlaceholder,
	descriptionId = 'regenerate-description',
	dialogDescription,
	isConfirmDisabled = false,
	isOpen,
	isPending = false,
	onConfirm,
	onDescriptionChange,
	onOpenChange,
	title,
}) => {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{dialogDescription}</DialogDescription>
				</DialogHeader>

				<div className='grid gap-2'>
					<label className='text-sm font-medium' htmlFor={descriptionId}>
						{descriptionLabel}
					</label>
					<Textarea
						id={descriptionId}
						placeholder={descriptionPlaceholder}
						rows={6}
						value={description}
						onChange={(event) => onDescriptionChange(event.target.value)}
					/>
				</div>

				<DialogFooter>
					<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
						{cancelLabel}
					</Button>
					<Button disabled={isPending || isConfirmDisabled} type='button' onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
