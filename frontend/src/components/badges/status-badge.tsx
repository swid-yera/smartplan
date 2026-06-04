'use client'

import type { ComponentProps, FC } from 'react'

import { getStatusLabels, statusIcons, statusVariants } from '@helpers'
import { Badge } from '@shadcn'
import { useLocaleStore } from '@store'
import type { Locale, StatusEnum } from '@types'

interface IProps extends ComponentProps<'span'> {
	status: StatusEnum
	asChild?: boolean
	locale?: Locale
}

export const StatusBadge: FC<IProps> = ({ status, locale, ...props }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const labels = getStatusLabels(locale ?? uiLocale)
	const Icon = statusIcons[status]

	return (
		<Badge variant={statusVariants[status] ?? 'default'} {...props}>
			<Icon data-icon='inline-start' />
			{labels[status] ?? status}
		</Badge>
	)
}
