'use client'

import type { FC } from 'react'

import { cn } from '@lib'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ScrollArea } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IPenalty } from '@types'
import { ShieldAlert } from 'lucide-react'

interface IPenaltyCardProps {
	penalties: IPenalty[]
	isLoading?: boolean
	className?: string
}

const dictionary = {
	ru: {
		title: 'Нарушения',
		description: 'Список нарушений по пользователю',
		penaltySectionTitle: 'Список нарушений по воспитательной части',
		empty: 'Нарушений пока нет',
		loading: 'Загрузка нарушений...',
		total: 'Всего списано',
		points: 'баллов',
	},
	kk: {
		title: 'Бұзушылықтар',
		description: 'Пайдаланушыға қатысты бұзушылықтар тізімі',
		penaltySectionTitle: 'Тәрбие бөлімі бойынша бұзушылықтар тізімі',
		empty: 'Бұзушылықтар жоқ',
		loading: 'Бұзушылықтар жүктелуде...',
		total: 'Жалпы шегерілді',
		points: 'ұпай',
	},
} as const

export const PenaltyCard: FC<IPenaltyCardProps> = ({ penalties, isLoading = false, className }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = dictionary[locale] ?? dictionary.ru
	const totalPenaltyPoints = penalties.reduce((sum, penalty) => sum + penalty.points, 0)
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'

	return (
		<Card className={cn('flex h-full flex-col overflow-hidden', className)}>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<ShieldAlert className='h-5 w-5 text-destructive' />
					{t.title}
				</CardTitle>
				<CardDescription>{t.description}</CardDescription>
			</CardHeader>
			<CardContent className='flex min-h-0 flex-1 flex-col gap-3'>
				<p className='text-sm font-semibold'>{t.penaltySectionTitle}</p>

				{penalties.length > 0 && (
					<p className='text-sm font-medium text-muted-foreground'>
						{t.total}: <span className='text-destructive'>-{totalPenaltyPoints}</span> {t.points}
					</p>
				)}

				{isLoading ? (
					<p className='text-sm text-muted-foreground'>{t.loading}</p>
				) : penalties.length === 0 ? (
					<p className='text-sm text-muted-foreground'>{t.empty}</p>
				) : (
					<ScrollArea className='min-h-0 flex-1 max-h-[22rem]'>
						<div className='space-y-2 pr-3'>
							{penalties.map((penalty) => (
								<div key={penalty.id} className='rounded-md border p-3'>
									<p className='font-semibold text-destructive'>
										-{penalty.points} {t.points}
									</p>
									<p className='text-sm'>{penalty.note}</p>
									<p className='mt-1 text-xs text-muted-foreground'>
										{new Date(penalty.createdAt).toLocaleString(dateLocale)}
									</p>
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	)
}
