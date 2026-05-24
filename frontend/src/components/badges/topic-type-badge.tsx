'use client'

import type { ComponentProps, FC } from 'react'

import { getTopicTypeLabels, topicTypeIcons, topicTypeVariants } from '@helpers'
import { Badge } from '@shadcn'
import { useLocaleStore } from '@store'
import type { TopicTypeEnum } from '@types'

interface IProps extends ComponentProps<'span'> {
	type: TopicTypeEnum
	asChild?: boolean
}

export const TopicTypeBadge: FC<IProps> = ({ type, ...props }) => {
	const locale = useLocaleStore((state) => state.locale)
	const labels = getTopicTypeLabels(locale)
	const Icon = topicTypeIcons[type]

	return (
		<>
			<Badge variant={topicTypeVariants[type] ?? 'outline'} {...props}>
				<Icon data-icon='inline-start' />
				{labels[type] ?? type}
			</Badge>
		</>
	)
}
