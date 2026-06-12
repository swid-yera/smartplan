'use client'

import { cn } from '@lib'
import { Button } from '@shadcn'

import { type SummaryCardConfig } from '../rating-stats.types'

interface IProps {
	cards: readonly SummaryCardConfig[]
}

export const RatingStatsSummaryCards = ({ cards }: IProps) => {
	return (
		<div className='grid gap-3 md:grid-cols-3'>
			{cards.map((card) => {
				const Icon = card.icon

				return (
					<div
						key={card.title}
						className='relative isolate min-h-31 overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md'
						style={{
							backgroundColor: card.theme.bg,
							borderColor: card.theme.border,
						}}
					>
						<div className='pointer-events-none absolute inset-0 overflow-hidden'>
							<div
								className='absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-35 blur-2xl'
								style={{ backgroundColor: card.theme.iconBg }}
							/>
							<div
								className='absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-25 blur-3xl'
								style={{ backgroundColor: card.theme.iconBg }}
							/>
							<div
								className='absolute right-4 top-4 h-16 w-16 rounded-full border opacity-35'
								style={{ borderColor: card.theme.border }}
							/>
							<div
								className='absolute bottom-4 right-16 h-3 w-24 -rotate-12 rounded-full opacity-30'
								style={{ backgroundColor: card.theme.accent }}
							/>
						</div>
						<div className='relative z-10 flex h-full flex-col'>
							<div className='flex items-center justify-between gap-3 px-4 pb-1 pt-3'>
								<div className='flex min-w-0 flex-1 flex-col gap-0.5'>
									<p className='truncate text-sm font-medium leading-none'>{card.title}</p>
									<p className='truncate text-xs leading-tight text-muted-foreground'>{card.description}</p>
								</div>
								<Button
									disabled
									aria-hidden='true'
									className='h-10 w-10 shrink-0 rounded-xl border px-0 shadow-sm'
									style={{
										backgroundColor: card.theme.iconBg,
										borderColor: card.theme.border,
										color: card.theme.accent,
									}}
									tabIndex={-1}
									type='button'
									variant='outline'
								>
									<Icon data-icon='inline-start' />
								</Button>
							</div>

							<div className='mt-auto flex items-end justify-between gap-3 px-4 pb-3 pt-0'>
								<p
									className={cn(
										'font-semibold tracking-tight leading-none tabular-nums',
										card.theme.valueClassName,
									)}
									style={{ color: card.theme.accent }}
								>
									{card.value}
								</p>
								<div
									className='hidden h-2 w-14 rounded-full md:block'
									style={{ backgroundColor: card.theme.iconBg }}
								/>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
