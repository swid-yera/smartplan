import type { ComponentProps, FC, ReactNode } from 'react'

import { cn } from '@lib'

interface ISectionTitleProps extends ComponentProps<'div'> {
	title: ReactNode
	description?: ReactNode
	actions?: ReactNode
}

export const SectionTitle: FC<ISectionTitleProps> = ({ title, description, actions, className, ...props }) => {
	return (
		<div className={cn('w-full border-b pb-3 space-y-1', className)} {...props}>
			<div className='flex items-center justify-between gap-4'>
				<h2 className='text-xl md:text-2xl font-semibold tracking-tight'>{title}</h2>
				{actions}
			</div>
			{description && <p className='text-sm md:text-base text-muted-foreground'>{description}</p>}
		</div>
	)
}
