'use client'

import type { ComponentProps, FC } from 'react'

import Link from 'next/link'

import { Button, Card, CardContent } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ReviewEntityType } from '@types'
import { AwardIcon, BookOpen, type LucideIcon, PenIcon, Plus } from 'lucide-react'

import locale from './locale.json'

interface IProps extends ComponentProps<typeof Card> {
	type: ReviewEntityType
}

export const EmptyCard: FC<IProps> = ({ type, ...props }) => {
	const currentLocale = useLocaleStore((state) => state.locale)
	const t = locale[currentLocale] ?? locale.ru
	const config = getTypeConfig(t)
	const Icon = typeConfig[type].icon

	return (
		<Card {...props}>
			<CardContent className='py-12 text-center space-y-3'>
				<Icon className='mx-auto h-10 w-10 text-muted-foreground' />
				<p className='font-medium'>{config[type].title}</p>
				<p className='text-sm text-muted-foreground max-w-md mx-auto'>{config[type].description}</p>

				<Button asChild className='mt-4'>
					<Link href={config[type].href}>
						<Plus className='mr-2 h-4 w-4' />
						{config[type].create}
					</Link>
				</Button>
			</CardContent>
		</Card>
	)
}

interface IConfig {
	title: string
	icon: LucideIcon
	description: string
	create: string
	href: string
}

const typeConfig: Record<ReviewEntityType, IConfig> = {
	AWARD: {
		title: 'Ваши данные не найдены',
		icon: AwardIcon,
		description: 'Здесь будут отображаться ваши данные для оценки KPI.',
		href: '/kpi/create',
		create: 'Опубликовать достижение',
	},
	LESSON: {
		title: 'Планы учебных занятий не найдены',
		icon: BookOpen,
		description: 'Здесь будут отображаться планы учебных занятий, созданные вами или сгенерированные системой.',
		href: '/lessons/create',
		create: 'Создать первый план',
	},
	RUP: {
		title: 'Рабочие учебные планы не найдены',
		icon: PenIcon,
		description: 'Здесь будут отображаться ваши РУП.',
		href: '/rups/create',
		create: 'Создать РУП',
	},
}

const getTypeConfig = (t: (typeof locale)['ru']) => {
	return {
		AWARD: {
			...typeConfig.AWARD,
			title: t.emptyCard.awardTitle,
			description: t.emptyCard.awardDescription,
			create: t.emptyCard.awardCreate,
		},
		LESSON: {
			...typeConfig.LESSON,
			title: t.emptyCard.lessonTitle,
			description: t.emptyCard.lessonDescription,
			create: t.emptyCard.lessonCreate,
		},
		RUP: {
			...typeConfig.RUP,
			title: t.emptyCard.rupTitle,
			description: t.emptyCard.rupDescription,
			create: t.emptyCard.rupCreate,
		},
	} satisfies Record<ReviewEntityType, IConfig>
}
