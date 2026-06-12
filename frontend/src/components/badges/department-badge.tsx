'use client'

import type { ComponentProps, FC } from 'react'

import { getLocaleText } from '@helpers'
import { cn } from '@lib'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IUserDepartment, type Locale } from '@types'
import { Building2 } from 'lucide-react'

interface IProps extends ComponentProps<'span'> {
	departments?: IUserDepartment[] | null
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

export const DepartmentBadge: FC<IProps> = ({ departments, locale, size = 'md', className, ...props }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const names = (departments ?? [])
		.map((department) => getLocaleText(department.name, locale ?? uiLocale))
		.filter(Boolean)
	const title = names.join(', ')
	const sizeClasses = badgeSizeClasses[size]

	if (!title) return null

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge
					className={cn(
						'inline-flex items-center gap-1 overflow-hidden rounded-full border font-medium leading-none',
						sizeClasses.badge,
						className,
					)}
					title={title}
					variant='outline'
					{...props}
				>
					<Building2 className={cn('shrink-0', sizeClasses.icon)} />
					<span className={cn('truncate', sizeClasses.label)}>{title}</span>
				</Badge>
			</TooltipTrigger>
			<TooltipContent side='top' sideOffset={8}>
				<p className='max-w-sm text-center text-xs leading-relaxed'>{title}</p>
			</TooltipContent>
		</Tooltip>
	)
}
