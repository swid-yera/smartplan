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
}

export const DepartmentBadge: FC<IProps> = ({ departments, locale, className, ...props }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const names = (departments ?? [])
		.map((department) => getLocaleText(department.name, locale ?? uiLocale))
		.filter(Boolean)
	const title = names.join(', ')

	if (!title) return null

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge
					className={cn(
						'inline-flex h-5 items-center gap-1 overflow-hidden rounded-full border px-1.5 py-0 text-[10px] font-medium leading-none',
						className,
					)}
					title={title}
					variant='outline'
					{...props}
				>
					<Building2 className='h-2.5 w-2.5 shrink-0' />
					<span className='max-w-30 truncate'>{title}</span>
				</Badge>
			</TooltipTrigger>
			<TooltipContent side='top' sideOffset={8}>
				<p className='max-w-sm text-center text-xs leading-relaxed'>{title}</p>
			</TooltipContent>
		</Tooltip>
	)
}
