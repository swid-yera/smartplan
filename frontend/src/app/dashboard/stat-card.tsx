import type { FC } from 'react'

import Link from 'next/link'

import { cn } from '@lib'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import type { LucideIcon } from 'lucide-react'

interface IProps {
	title: string
	description?: string
	reviewCount: number
	secondaryCount: number
	icon: LucideIcon
	accent?: 'warning' | 'success' | 'info'
	href?: string
	reviewLabel?: string
	secondaryLabel?: string
	ctaLabel?: string
}

const accentStyles = {
	warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
	success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
	info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
}

export const StatCard: FC<IProps> = ({
	title,
	description,
	reviewCount,
	secondaryCount,
	icon: Icon,
	accent = 'info',
	href,
	reviewLabel = 'Ожидают проверки',
	secondaryLabel = 'За сегодня',
	ctaLabel = 'Посмотреть все',
}) => {
	return (
		<Card className='transition hover:shadow-md hover:-translate-y-0.5'>
			<CardHeader className='flex flex-row items-start justify-between gap-4'>
				<div className='space-y-1'>
					<CardTitle className='text-sm font-medium leading-none'>{title}</CardTitle>
					{description && <p className='text-xs text-muted-foreground'>{description}</p>}
				</div>

				<div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accentStyles[accent])}>
					<Icon className='h-5 w-5' />
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				<div className='flex items-end justify-between'>
					<div>
						<div className='text-3xl font-bold leading-none'>{reviewCount}</div>
						<p className='mt-1 text-xs text-muted-foreground'>{reviewLabel}</p>
					</div>

					<div className='text-right'>
						<div className='text-lg font-semibold'>{secondaryCount}</div>
						<p className='text-xs text-muted-foreground'>{secondaryLabel}</p>
					</div>
				</div>

				{href && (
					<Button asChild className='w-full' size='sm' variant='outline'>
						<Link href={href}>{ctaLabel}</Link>
					</Button>
				)}
			</CardContent>
		</Card>
	)
}
