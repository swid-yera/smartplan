'use client'

import type { ComponentProps, FC } from 'react'

import { normalizeUserType } from '@helpers'
import { cn } from '@lib'
import { Badge } from '@shadcn'
import { useLocaleStore } from '@store'
import { type Locale, UserTypeEnum } from '@types'
import { BadgeCheck, CircleHelp, Crown, Sparkles, Users } from 'lucide-react'

interface IProps extends ComponentProps<'span'> {
	userType: UserTypeEnum
	locale?: Locale
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

export const UserTypeBadge: FC<IProps> = ({ userType, locale, className, ...props }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const theme = userTypeTheme[userType]
	const Icon = userTypeIcons[userType]
	const labels = normalizeUserType(userType, locale ?? uiLocale)

	return (
		<Badge
			className={cn(
				'inline-flex h-5 items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium leading-none',
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
			<Icon className='h-2.5 w-2.5 shrink-0' />
			<span className='max-w-[120px] truncate'>{labels}</span>
		</Badge>
	)
}
