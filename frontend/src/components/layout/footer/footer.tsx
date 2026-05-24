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
		<footer className={cn('text-center text-sm text-gray-500 py-8 border-t mt-10', className)} {...props}>
			<p>
				© {currentYear} {t.text} <u>"Almaty Polytech College"</u>.
			</p>
		</footer>
	)
}
