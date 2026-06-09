'use client'

import type { DetailedHTMLProps, FC, HTMLAttributes } from 'react'

import { cn } from '@lib'
import { useLocaleStore } from '@store'

import footerLocale from './locale.json'

export const Footer: FC<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>> = ({
	className,
	...props
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = footerLocale[locale] ?? footerLocale.ru
	const currentYear = new Date().getFullYear()

	return (
		<footer className={cn('mt-auto border-t py-8 text-center text-sm text-gray-500', className)} {...props}>
			<p className='whitespace-pre-line'>
				© {currentYear} {t.text} <u>"Almaty Polytech College"</u>.
			</p>
		</footer>
	)
}
