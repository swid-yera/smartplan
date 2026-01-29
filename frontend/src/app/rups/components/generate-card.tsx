import type { FC, PropsWithChildren, ReactNode } from 'react'

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
	CardHeader,
	CardTitle,
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

				<div className='flex flex-col gap-3 items-end'>
					<AlertDialog>
						<TooltipProvider delayDuration={200}>
							<Tooltip>
								<TooltipTrigger asChild>
									<span>
										<AlertDialogTrigger asChild>
											<Button className='shrink-0' disabled={disabled}>
												{buttonText}
											</Button>
										</AlertDialogTrigger>
									</span>
								</TooltipTrigger>

								{disabled && (
									<TooltipContent>
										<p>{disabledReason}</p>
									</TooltipContent>
								)}
							</Tooltip>
						</TooltipProvider>

						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
								<AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
							</AlertDialogHeader>

							<AlertDialogFooter>
								<AlertDialogCancel>Отмена</AlertDialogCancel>
								<AlertDialogAction onClick={onClick}>Сгенерировать</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					{children}
				</div>
			</CardContent>
		</Card>
	)
}
