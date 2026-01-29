import type { ComponentProps, FC } from 'react'

import { topicTypeIcons, topicTypeLabels, topicTypeVariants } from '@helpers'
import { Badge } from '@shadcn'
import type { TopicTypeEnum } from '@types'

interface IProps extends ComponentProps<'span'> {
	type: TopicTypeEnum
	asChild?: boolean
}

export const TopicTypeBadge: FC<IProps> = ({ type, ...props }) => {
	const Icon = topicTypeIcons[type]

	return (
		<>
			<Badge variant={topicTypeVariants[type] ?? 'outline'} {...props}>
				<Icon data-icon='inline-start' />
				{topicTypeLabels[type] ?? type}
			</Badge>
		</>
	)
}
