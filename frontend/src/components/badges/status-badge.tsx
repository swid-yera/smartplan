import type { ComponentProps, FC } from 'react'

import { statusIcons, statusLabels, statusVariants } from '@helpers'
import { Badge } from '@shadcn'
import type { StatusEnum } from '@types'

interface IProps extends ComponentProps<'span'> {
	status: StatusEnum
	asChild?: boolean
}

export const StatusBadge: FC<IProps> = ({ status, ...props }) => {
	const Icon = statusIcons[status]

	return (
		<Badge variant={statusVariants[status] ?? 'default'} {...props}>
			<Icon data-icon='inline-start' />
			{statusLabels[status] ?? status}
		</Badge>
	)
}
