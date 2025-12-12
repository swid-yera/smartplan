'use client'

import type { FC } from 'react'

import { Badge, Button, Heading } from '@ui'

import type { ITab } from './page'

interface ITabHeaderProps {
	tab: ITab
}

export const TabHeader: FC<ITabHeaderProps> = ({ tab }) => {
	return (
		<div className='flex items-center justify-between mb-2'>
			<div>
				<Heading align='left' size='h2'>
					{tab.fullTitle} <Badge variant='outline'>Черновик</Badge>
				</Heading>
				<p className='text-muted-foreground'>{tab.description}</p>
			</div>

			<Button size='lg' type='button' variant='default'>
				Прикол
			</Button>
		</div>
	)
}
