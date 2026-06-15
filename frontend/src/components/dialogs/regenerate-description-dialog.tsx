'use client'

import { type FC } from 'react'

import {
	Button,
	Calendar,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Textarea,
} from '@shadcn'
import { format } from 'date-fns'
import { CalendarDays, ChevronDown } from 'lucide-react'

interface IRegenerateDescriptionDialogProps {
	cancelLabel: string
	confirmLabel: string
	eventDate?: Date
	eventDateLabel?: string
	eventDatePlaceholder?: string
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
	onEventDateChange?: (value: Date | undefined) => void
	onOpenChange: (open: boolean) => void
	title: string
}

export const RegenerateDescriptionDialog: FC<IRegenerateDescriptionDialogProps> = ({
	cancelLabel,
	confirmLabel,
	eventDate,
	eventDateLabel,
	eventDatePlaceholder,
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
	onEventDateChange,
	onOpenChange,
	title,
}) => {
	const shouldShowEventDate = Boolean(eventDateLabel && eventDatePlaceholder && onEventDateChange)

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{dialogDescription}</DialogDescription>
				</DialogHeader>

				<div className='grid gap-4'>
					{shouldShowEventDate ? (
						<div className='grid gap-2'>
							<label className='inline-flex items-center gap-2 text-sm font-medium'>
								<CalendarDays className='h-4 w-4 text-primary' />
								{eventDateLabel}
							</label>
							<Popover>
								<PopoverTrigger asChild>
									<Button className='w-full justify-between font-normal' type='button' variant='outline'>
										{eventDate ? format(eventDate, 'dd.MM.yyyy') : eventDatePlaceholder}
										<ChevronDown className='h-4 w-4 opacity-60' />
									</Button>
								</PopoverTrigger>
								<PopoverContent align='start' className='w-auto overflow-hidden p-0'>
									<Calendar
										captionLayout='dropdown'
										defaultMonth={eventDate}
										mode='single'
										selected={eventDate}
										onSelect={onEventDateChange}
									/>
								</PopoverContent>
							</Popover>
						</div>
					) : null}

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
