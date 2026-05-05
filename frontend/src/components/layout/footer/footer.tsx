import type { DetailedHTMLProps, FC, HTMLAttributes } from 'react'

import { cn } from '@lib'

export const Footer: FC<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>> = ({
	className,
	...props
}) => {
	const currentYear = new Date().getFullYear()

	return (
		<footer className={cn('text-center text-sm text-gray-500 py-8 border-t mt-10', className)} {...props}>
			<p>
				© {currentYear} Система управления учебными планами для <u>"Almaty Polytech College"</u>.
			</p>
		</footer>
	)
}
