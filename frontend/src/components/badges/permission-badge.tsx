'use client'

import type { FC } from 'react'

import { getPermissionLabels } from '@helpers'
import { cn } from '@lib'
import { Badge } from '@shadcn'
import { useLocaleStore } from '@store'
import { PermissionCodeEnum } from '@types'
import { Layers3, PencilLine, ShieldCheck } from 'lucide-react'

interface IProps {
	permission: PermissionCodeEnum
	className?: string
}

const permissionTheme = {
	[PermissionCodeEnum.RUP_VIEW]: {
		accent: 'var(--chart-1)',
		border: 'color-mix(in oklch, var(--chart-1) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-1) 10%, transparent)',
	},
	[PermissionCodeEnum.RUP_MANAGE]: {
		accent: 'var(--chart-1)',
		border: 'color-mix(in oklch, var(--chart-1) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-1) 10%, transparent)',
	},
	[PermissionCodeEnum.RUP_FULL]: {
		accent: 'var(--chart-1)',
		border: 'color-mix(in oklch, var(--chart-1) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-1) 10%, transparent)',
	},
	[PermissionCodeEnum.KPI_VIEW]: {
		accent: 'var(--chart-2)',
		border: 'color-mix(in oklch, var(--chart-2) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
	},
	[PermissionCodeEnum.KPI_MANAGE]: {
		accent: 'var(--chart-2)',
		border: 'color-mix(in oklch, var(--chart-2) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
	},
	[PermissionCodeEnum.KPI_FULL]: {
		accent: 'var(--chart-2)',
		border: 'color-mix(in oklch, var(--chart-2) 28%, transparent)',
		bg: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
	},
} as const

const permissionIcons = {
	[PermissionCodeEnum.RUP_VIEW]: Layers3,
	[PermissionCodeEnum.RUP_MANAGE]: PencilLine,
	[PermissionCodeEnum.RUP_FULL]: ShieldCheck,
	[PermissionCodeEnum.KPI_VIEW]: Layers3,
	[PermissionCodeEnum.KPI_MANAGE]: PencilLine,
	[PermissionCodeEnum.KPI_FULL]: ShieldCheck,
} as const

export const PermissionBadge: FC<IProps> = ({ permission, className }) => {
	const locale = useLocaleStore((state) => state.locale)
	const labels = getPermissionLabels(locale)
	const Icon = permissionIcons[permission]
	const theme = permissionTheme[permission]

	return (
		<Badge
			className={cn(
				'inline-flex h-5 items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium leading-none',
				className,
			)}
			title={labels[permission]}
			style={{
				backgroundColor: theme.bg,
				borderColor: theme.border,
				color: theme.accent,
			}}
			variant='outline'
		>
			<Icon className='h-2.5 w-2.5 shrink-0' />
			<span className='max-w-[120px] truncate'>{labels[permission]}</span>
		</Badge>
	)
}
