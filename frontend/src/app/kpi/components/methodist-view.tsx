import type { FC } from 'react'

import { Heading } from '@ui'

import { AwardsTable, HeroCard } from '.'
import { mockAwards } from '../mock.data'

export const MethodistView: FC = () => {
	return (
		<section className='p-4 w-full'>
			<Heading align='left' size='h2'>
				Награды
			</Heading>

			{/* top block */}
			<div className='mt-4'>
				<HeroCard />
			</div>

			{/* table */}
			<AwardsTable awards={mockAwards} className='mt-4' isMethodist />
		</section>
	)
}
