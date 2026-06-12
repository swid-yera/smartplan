'use client'

import type { ComponentProps, FC } from 'react'

import { normalizeUserRole } from '@helpers'
import { cn } from '@lib'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type Locale, RoleEnum } from '@types'
import { Crown, GraduationCap, PencilLine, ShieldCheck } from 'lucide-react'

interface IProps extends ComponentProps<'span'> {
	role: RoleEnum
	locale?: Locale
	size?: BadgeSize
}

type BadgeSize = 'sm' | 'md' | 'lg'

const badgeSizeClasses: Record<BadgeSize, { badge: string; label: string; icon: string }> = {
	sm: {
		badge: 'h-5 px-1.5 py-0 text-[9px]',
		label: 'max-w-[100px]',
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

const roleTheme = {
	[RoleEnum.ADMIN]: {
		accent: 'var(--primary)',
		border: 'color-mix(in oklch, var(--primary) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--primary) 10%, transparent)',
	},
	[RoleEnum.METHODIST]: {
		accent: 'var(--chart-2)',
		border: 'color-mix(in oklch, var(--chart-2) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
	},
	[RoleEnum.TEACHER]: {
		accent: 'var(--chart-1)',
		border: 'color-mix(in oklch, var(--chart-1) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-1) 10%, transparent)',
	},
	[RoleEnum.SPECIAL]: {
		accent: 'var(--chart-3)',
		border: 'color-mix(in oklch, var(--chart-3) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-3) 10%, transparent)',
	},
} as const

const roleIcons = {
	[RoleEnum.ADMIN]: ShieldCheck,
	[RoleEnum.METHODIST]: PencilLine,
	[RoleEnum.TEACHER]: GraduationCap,
	[RoleEnum.SPECIAL]: Crown,
} as const

export const UserRoleBadge: FC<IProps> = ({ role, locale, size = 'md', className, ...props }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const theme = roleTheme[role]
	const Icon = roleIcons[role]
	const labels = normalizeUserRole(role, locale ?? uiLocale)
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
