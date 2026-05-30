import { type ComponentProps, type FC, type PropsWithChildren, type ReactNode, useState } from 'react'

import { getUILocaleSection } from '@helpers'
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { Sparkles } from 'lucide-react'
import localeDictionary from './locale.json'

interface GenerateCardProps {
	title: string
	description?: string | ReactNode

	disabled?: boolean
	disabledReason?: string

	onClick: () => void

	buttonText?: string
	confirmTitle?: string
	confirmDescription?: string
	confirmContent?: ReactNode
	confirmButtonText?: string
}

interface GenerateConfirmButtonProps {
	onClick: () => void
	buttonText?: string
	disabled?: boolean
	disabledReason?: string
	confirmDisabled?: boolean
	confirmTitle?: string
	confirmDescription?: string | ReactNode
	confirmContent?: ReactNode
	confirmButtonText?: string
	triggerClassName?: string
	triggerSize?: ComponentProps<typeof Button>['size']
	triggerVariant?: ComponentProps<typeof Button>['variant']
}

export const GenerateConfirmButton: FC<GenerateConfirmButtonProps> = ({
	onClick,
	buttonText,
	disabled = false,
	disabledReason,
	confirmDisabled = false,
	confirmTitle,
	confirmDescription,
	confirmContent,
	confirmButtonText,
	triggerClassName,
	triggerSize,
	triggerVariant,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).generate
	const [open, setOpen] = useState(false)
	const resolvedButtonText = buttonText ?? t.buttonText
	const resolvedDisabledReason = disabledReason ?? t.disabledReason
	const resolvedConfirmTitle = confirmTitle ?? t.confirmTitle
	const resolvedConfirmDescription = confirmDescription ?? t.confirmDescription
	const resolvedConfirmButtonText = confirmButtonText ?? t.confirmButtonText

	const handleConfirm = () => {
		if (disabled || confirmDisabled) return
		onClick()
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger asChild>
						<span>
							<DialogTrigger asChild>
								<Button
									className={triggerClassName}
									disabled={disabled}
									size={triggerSize}
									variant={triggerVariant}
								>
									{resolvedButtonText}
								</Button>
							</DialogTrigger>
						</span>
					</TooltipTrigger>

					{disabled && (
						<TooltipContent>
							<p>{resolvedDisabledReason}</p>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>{resolvedConfirmTitle}</DialogTitle>
					{resolvedConfirmDescription && <DialogDescription>{resolvedConfirmDescription}</DialogDescription>}
				</DialogHeader>

				{confirmContent}

				<DialogFooter>
					<Button type='button' variant='outline' onClick={() => setOpen(false)}>
						{t.cancel}
					</Button>
					<Button disabled={disabled || confirmDisabled} type='button' onClick={handleConfirm}>
						{resolvedConfirmButtonText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export const GenerateCard: FC<PropsWithChildren<GenerateCardProps>> = ({
	title,
	description,

	disabled = false,
	disabledReason,

	onClick,
	children,

	buttonText,
	confirmTitle,
	confirmDescription,
	confirmContent,
	confirmButtonText,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).generate

	return (
		<Card className='border-dashed'>
			<CardHeader className='pb-3'>
				<CardTitle className='flex items-center gap-2 text-base'>
					<Sparkles className='h-4 w-4 text-primary' />
					{title}
				</CardTitle>
			</CardHeader>

			<CardContent className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div className='max-w-2xl text-sm'>
					{description && <p className='text-muted-foreground'>{description}</p>}
					<p className='text-primary font-semibold'>{t.warning}</p>
				</div>

				<div className='flex flex-col items-end gap-3'>
					<GenerateConfirmButton
						buttonText={buttonText ?? t.buttonText}
						confirmButtonText={confirmButtonText ?? t.confirmButtonText}
						confirmContent={confirmContent}
						confirmDescription={confirmDescription ?? t.confirmDescription}
						confirmTitle={confirmTitle ?? t.confirmTitle}
						disabled={disabled}
						disabledReason={disabledReason ?? t.disabledReason}
						triggerClassName='shrink-0'
						onClick={onClick}
					/>

					{children}
				</div>
			</CardContent>
		</Card>
	)
}
