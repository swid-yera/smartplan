import type { FC } from 'react'

import { TabsList, TabsTrigger } from '@ui'

import type { ITab } from './page'

interface ITabIndicatorProps {
	steps: ITab[]
}

export const TabIndicator: FC<ITabIndicatorProps> = ({ steps }) => {
	return (
		<TabsList className='w-full bg-background justify-start rounded-none border-b p-0'>
			{steps.map((step) => (
				<TabsTrigger
					key={step.id}
					className='bg-background border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t-lg border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5'
					value={String(step.id)}
				>
					{step.title}
				</TabsTrigger>
			))}
		</TabsList>
	)
}
