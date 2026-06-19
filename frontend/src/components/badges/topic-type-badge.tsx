'use client'

import type { ComponentProps, FC, ReactNode } from 'react'

import { getTopicTypeLabels, topicTypeIcons, topicTypeVariants } from '@helpers'
import { Badge } from '@shadcn'
import { useLocaleStore } from '@store'
import type { Locale, TopicTypeEnum } from '@types'

interface IProps extends ComponentProps<'span'> {
	type: TopicTypeEnum
	asChild?: boolean
	label?: ReactNode
	locale?: Locale
}

export const TopicTypeBadge: FC<IProps> = ({ label, type, locale, ...props }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const labels = getTopicTypeLabels(locale ?? uiLocale)
	const Icon = topicTypeIcons[type]

	return (
		<Badge variant={topicTypeVariants[type] ?? 'outline'} {...props}>
			<Icon data-icon='inline-start' />
			{label ?? labels[type] ?? type}
		</Badge>
	)
}
