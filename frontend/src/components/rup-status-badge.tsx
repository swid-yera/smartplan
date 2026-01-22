import type { ComponentProps, FC } from 'react'

import { rupStatusIcons, rupStatusLabels, rupStatusVariants } from '@helpers'
import type { StatusEnum } from '@types'
import { Badge } from '@ui'

interface IProps extends ComponentProps<'span'> {
	status: StatusEnum
	asChild?: boolean
}

export const RupStatusBadge: FC<IProps> = ({ status, ...props }) => {
	const Icon = rupStatusIcons[status]

	return (
		<Badge variant={rupStatusVariants[status] ?? 'default'} {...props}>
			<Icon data-icon='inline-start' />
			{rupStatusLabels[status] ?? status}
		</Badge>
	)
}
