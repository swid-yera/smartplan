'use client'

import type { ComponentProps, FC } from 'react'

import { cn } from '@lib'
import { Button } from '@shadcn'
import { type Locale } from '@types'
import { Languages } from 'lucide-react'

type ILocaleToggleButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
	activeLocale: Locale
	labels: Record<Locale, string>
	onChangeLocale: (nextLocale: Locale) => void
}

export const LocaleToggleButton: FC<ILocaleToggleButtonProps> = ({
	activeLocale,
	labels,
	onChangeLocale,
	className,
	variant = 'default',
	...props
}) => {
	const nextLocale: Locale = activeLocale === 'ru' ? 'kk' : 'ru'

	return (
		<Button
			className={cn('h-9 gap-2', className)}
			type='button'
			variant={variant}
			onClick={() => onChangeLocale(nextLocale)}
			{...props}
		>
			<Languages className='h-4 w-4' />
			{labels[nextLocale]}
		</Button>
	)
}
