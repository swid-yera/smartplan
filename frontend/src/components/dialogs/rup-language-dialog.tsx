'use client'

import { type FC, useEffect, useState } from 'react'

import { cn } from '@lib'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import type { Locale } from '@types'
import { Check } from 'lucide-react'

interface IRupLanguageDialogProps {
	open: boolean
	required?: boolean
	currentLanguage: Locale | null
	title: string
	description: string
	languageLabels: Record<Locale, string>
	confirmLabel?: string
	onOpenChange: (open: boolean) => void
	onConfirm: (language: Locale) => void
}

const dictionary = {
	ru: {
		confirm: 'Подтвердить',
		cancel: 'Отмена',
	},
	kk: {
		confirm: 'Растау',
		cancel: 'Болдырмау',
	},
} as const

export const RupLanguageDialog: FC<IRupLanguageDialogProps> = ({
	open,
	required = false,
	currentLanguage,
	title,
	description,
	languageLabels,
	confirmLabel,
	onOpenChange,
	onConfirm,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = dictionary[locale] ?? dictionary.ru
	const [selectedLanguage, setSelectedLanguage] = useState<Locale>(currentLanguage ?? 'ru')

	useEffect(() => {
		if (!open) return
		setSelectedLanguage(currentLanguage ?? 'ru')
	}, [currentLanguage, open])

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (required && !nextOpen) return
				onOpenChange(nextOpen)
			}}
		>
			<DialogContent showCloseButton={!required}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className='grid gap-3 sm:grid-cols-2'>
					<Button
						className={cn(
							'justify-between gap-3 py-6',
							selectedLanguage === 'ru' && 'border-primary bg-primary/5 text-primary hover:bg-primary/10',
						)}
						type='button'
						variant='outline'
						onClick={() => setSelectedLanguage('ru')}
					>
						<span className='text-left'>{languageLabels.ru}</span>
						{selectedLanguage === 'ru' && <Check className='h-4 w-4' />}
					</Button>

					<Button
						className={cn(
							'justify-between gap-3 py-6',
							selectedLanguage === 'kk' && 'border-primary bg-primary/5 text-primary hover:bg-primary/10',
						)}
						type='button'
						variant='outline'
						onClick={() => setSelectedLanguage('kk')}
					>
						<span className='text-left'>{languageLabels.kk}</span>
						{selectedLanguage === 'kk' && <Check className='h-4 w-4' />}
					</Button>
				</div>

				<DialogFooter className='sm:justify-start gap-2'>
					{!required && (
						<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
							{t.cancel}
						</Button>
					)}
					<Button type='button' onClick={() => onConfirm(selectedLanguage)}>
						{confirmLabel ?? t.confirm}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
