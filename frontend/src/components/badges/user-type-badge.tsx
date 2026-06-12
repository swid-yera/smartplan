'use client'

import type { ComponentProps, FC } from 'react'

import { normalizeUserType } from '@helpers'
import { cn } from '@lib'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type Locale, UserTypeEnum } from '@types'
import { BadgeCheck, CircleHelp, Crown, Sparkles, Users } from 'lucide-react'

interface IProps extends ComponentProps<'span'> {
	userType: UserTypeEnum
	locale?: Locale
	size?: BadgeSize
}

type BadgeSize = 'sm' | 'md' | 'lg'

const badgeSizeClasses: Record<BadgeSize, { badge: string; label: string; icon: string }> = {
	sm: {
		badge: 'h-5 px-1.5 py-0 text-[9px]',
		label: 'max-w-[120px]',
		icon: 'h-2.5 w-2.5',
	},
	md: {
		badge: 'h-5 px-1.5 py-0 text-[10px]',
		label: 'max-w-[180px]',
		icon: 'h-2.5 w-2.5',
	},
	lg: {
		badge: 'h-6 px-2 py-0 text-xs',
		label: 'max-w-[300px]',
		icon: 'h-3 w-3',
	},
}

const userTypeTheme = {
	[UserTypeEnum.GENERAL]: {
		accent: 'var(--chart-1)',
		border: 'color-mix(in oklch, var(--chart-1) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-1) 10%, transparent)',
	},
	[UserTypeEnum.HEAD]: {
		accent: 'var(--primary)',
		border: 'color-mix(in oklch, var(--primary) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--primary) 10%, transparent)',
	},
	[UserTypeEnum.MASTER]: {
		accent: 'var(--chart-2)',
		border: 'color-mix(in oklch, var(--chart-2) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
	},
	[UserTypeEnum.SPECIALIST]: {
		accent: 'var(--chart-3)',
		border: 'color-mix(in oklch, var(--chart-3) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-3) 10%, transparent)',
	},
	[UserTypeEnum.NULL]: {
		accent: 'var(--muted-foreground)',
		border: 'color-mix(in oklch, var(--muted-foreground) 24%, transparent)',
		bg: 'color-mix(in oklch, var(--muted) 55%, transparent)',
	},
} as const

const userTypeIcons = {
	[UserTypeEnum.GENERAL]: Users,
	[UserTypeEnum.HEAD]: Crown,
	[UserTypeEnum.MASTER]: BadgeCheck,
	[UserTypeEnum.SPECIALIST]: Sparkles,
	[UserTypeEnum.NULL]: CircleHelp,
} as const

export const UserTypeBadge: FC<IProps> = ({ userType, locale, size = 'md', className, ...props }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const theme = userTypeTheme[userType]
	const Icon = userTypeIcons[userType]
	const labels = normalizeUserType(userType, locale ?? uiLocale)
	const sizeClasses = badgeSizeClasses[size]

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge
					className={cn(
						'inline-flex items-center gap-1 overflow-hidden rounded-full border font-medium leading-none',
						sizeClasses.badge,
						className,
					)}
					style={{
						backgroundColor: theme.bg,
						borderColor: theme.border,
						color: theme.accent,
					}}
					title={labels}
					variant='outline'
					{...props}
				>
					<Icon className={cn('shrink-0', sizeClasses.icon)} />
					<span className={cn('truncate', sizeClasses.label)}>{labels}</span>
				</Badge>
			</TooltipTrigger>
			<TooltipContent side='top' sideOffset={8}>
				<p className='max-w-sm text-center text-xs leading-relaxed'>{labels}</p>
			</TooltipContent>
		</Tooltip>
	)
}
