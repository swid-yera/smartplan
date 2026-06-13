'use client'

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shadcn'

interface ISendToReviewPromptDialogProps {
	isOpen: boolean
	title: string
	description: string
	cancelLabel: string
	confirmLabel: string
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	isPending?: boolean
}

export const SendToReviewPromptDialog = ({
	isOpen,
	title,
	description,
	cancelLabel,
	confirmLabel,
	onOpenChange,
	onConfirm,
	isPending = false,
}: ISendToReviewPromptDialogProps) => {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
						{cancelLabel}
					</Button>
					<Button disabled={isPending} type='button' onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
