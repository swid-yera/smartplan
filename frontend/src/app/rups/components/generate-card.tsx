import { type ComponentProps, type FC, type PropsWithChildren, type ReactNode, useState } from 'react'

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
import { Sparkles } from 'lucide-react'

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
	buttonText = 'Сгенерировать',
	disabled = false,
	disabledReason = 'Заполните обязательные поля',
	confirmTitle = 'Сгенерировать описание?',
	confirmDescription = 'Текущие значения будут перезаписаны. Вы сможете отредактировать текст после генерации.',
	confirmContent,
	confirmButtonText = 'Сгенерировать',
	triggerClassName,
	triggerSize,
	triggerVariant,
}) => {
	const [open, setOpen] = useState(false)

	const handleConfirm = () => {
		if (disabled) return
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
									{buttonText}
								</Button>
							</DialogTrigger>
						</span>
					</TooltipTrigger>

					{disabled && (
						<TooltipContent>
							<p>{disabledReason}</p>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>{confirmTitle}</DialogTitle>
					{confirmDescription && <DialogDescription>{confirmDescription}</DialogDescription>}
				</DialogHeader>

				{confirmContent}

				<DialogFooter>
					<Button type='button' variant='outline' onClick={() => setOpen(false)}>
						Отмена
					</Button>
					<Button disabled={disabled} type='button' onClick={handleConfirm}>
						{confirmButtonText}
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
	disabledReason = 'Заполните обязательные поля',

	onClick,
	children,

	buttonText = 'Сгенерировать',
	confirmTitle = 'Сгенерировать описание?',
	confirmDescription = 'Текущие значения будут перезаписаны. Вы сможете отредактировать текст после генерации.',
	confirmContent,
	confirmButtonText = 'Сгенерировать',
}) => {
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
					<p className='text-primary font-semibold'>ВСЕ ДАННЫЕ СБРОСЯТСЯ И БУДУТ СГЕНЕРИРОВАНЫ</p>
				</div>

				<div className='flex flex-col items-end gap-3'>
					<GenerateConfirmButton
						buttonText={buttonText}
						confirmButtonText={confirmButtonText}
						confirmContent={confirmContent}
						confirmDescription={confirmDescription}
						confirmTitle={confirmTitle}
						disabled={disabled}
						disabledReason={disabledReason}
						triggerClassName='shrink-0'
						onClick={onClick}
					/>

					{children}
				</div>
			</CardContent>
		</Card>
	)
}
