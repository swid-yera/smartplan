import type { ComponentProps, FC } from 'react'

import Link from 'next/link'

import { Button, Card, CardContent } from '@shadcn'
import type { ReviewEntityType } from '@types'
import { AwardIcon, BookOpen, type LucideIcon, PenIcon, Plus } from 'lucide-react'

interface IProps extends ComponentProps<typeof Card> {
	type: ReviewEntityType
}

export const EmptyCard: FC<IProps> = ({ type, ...props }) => {
	const Icon = typeConfig[type].icon

	return (
		<Card {...props}>
			<CardContent className='py-12 text-center space-y-3'>
				<Icon className='mx-auto h-10 w-10 text-muted-foreground' />
				<p className='font-medium'>{typeConfig[type].title}</p>
				<p className='text-sm text-muted-foreground max-w-md mx-auto'>{typeConfig[type].description}</p>

				<Button asChild className='mt-4'>
					<Link href={typeConfig[type].href}>
						<Plus className='mr-2 h-4 w-4' />
						{typeConfig[type].create}
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
