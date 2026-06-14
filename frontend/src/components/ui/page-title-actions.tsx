'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'

import { cn } from '@lib'
import { Button, ButtonGroup, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shadcn'
import { Loader2, type LucideIcon, MoreVertical } from 'lucide-react'

type PageTitleActionBase = {
	id: string
	label: ReactNode
	icon: LucideIcon
	variant?: 'default' | 'destructive'
	disabled?: boolean
	pending?: boolean
	priority?: 'primary' | 'normal' | 'overflow'
	form?: string
	type?: 'button' | 'submit'
}

type PageTitleLinkAction = PageTitleActionBase & {
	href: string
	onClick?: never
}

type PageTitleClickAction = PageTitleActionBase & {
	href?: never
	onClick?: () => void
}

export type PageTitleAction = PageTitleLinkAction | PageTitleClickAction

interface IPageTitleActionsProps {
	actions?: PageTitleAction[]
	trailing?: ReactNode
	moreLabel: string
	className?: string
}

const getPrimaryAction = (actions: PageTitleAction[]) => {
	if (actions.length === 1) return actions[0]

	return actions.find((action) => action.priority === 'primary') ?? actions.find((action) => action.priority !== 'overflow')
}

const isActionDisabled = (action: PageTitleAction) => action.disabled || action.pending

export const PageTitleActions = ({ actions = [], trailing, moreLabel, className }: IPageTitleActionsProps) => {
	const primaryAction = getPrimaryAction(actions) ?? null
	const overflowActions = actions.filter((action) => action !== primaryAction)

	if (!primaryAction && overflowActions.length === 0 && !trailing) return null

	const renderAction = (action: PageTitleAction) => {
		const disabled = isActionDisabled(action)
		const Icon = action.pending ? Loader2 : action.icon

		if (action.href && !disabled) {
			return (
				<Button asChild key={action.id} className='h-9 hover:text-primary' variant='outline'>
					<Link href={action.href}>
						<Icon className={cn('mr-2 h-4 w-4', action.pending && 'animate-spin')} />
						{action.label}
					</Link>
				</Button>
			)
		}

		return (
			<Button
				key={action.id}
				className={cn('h-9', action.variant === 'destructive' ? 'hover:text-destructive' : 'hover:text-primary')}
				disabled={disabled}
				form={action.form}
				type={action.type ?? 'button'}
				variant='outline'
				onClick={action.href ? undefined : action.onClick}
			>
				<Icon className={cn('mr-2 h-4 w-4', action.pending && 'animate-spin')} />
				{action.label}
			</Button>
		)
	}

	return (
		<ButtonGroup className={cn('w-full flex-wrap justify-end sm:w-auto', className)}>
			{primaryAction ? renderAction(primaryAction) : null}

			{overflowActions.length > 0 ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button aria-label={moreLabel} className='h-9 px-3' type='button' variant='outline'>
							<MoreVertical className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end' className='w-56'>
						{overflowActions.map((action) => {
							const disabled = isActionDisabled(action)
							const Icon = action.pending ? Loader2 : action.icon

							return action.href && !disabled ? (
								<DropdownMenuItem key={action.id} asChild variant={action.variant}>
									<Link href={action.href}>
										<Icon className={cn('mr-2 h-4 w-4', action.pending && 'animate-spin')} />
										{action.label}
									</Link>
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									key={action.id}
									disabled={disabled}
									variant={action.variant}
									onClick={action.href ? undefined : action.onClick}
								>
									<Icon className={cn('mr-2 h-4 w-4', action.pending && 'animate-spin')} />
									{action.label}
								</DropdownMenuItem>
							)
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}

			{trailing}
		</ButtonGroup>
	)
}
