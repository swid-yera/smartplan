import type { ComponentProps, FC } from 'react'

import { rupStatusLabels, rupStatusVariants } from '@helpers'
import type { RupStatusEnum } from '@types'
import { Badge } from '@ui'

interface IProps extends ComponentProps<'span'> {
	status: RupStatusEnum
	asChild?: boolean
}

export const RupStatusBadge: FC<IProps> = ({ status, ...props }) => {
	return (
		<Badge variant={rupStatusVariants[status] ?? 'default'} {...props}>
			{rupStatusLabels[status] ?? status}{' '}
		</Badge>
	)
}
