import type { FC } from 'react'

import { Heading } from '@ui'

import { AwardsTable, CreateCard, HeroCard } from '.'
import { mockAwards } from '../mock.data'

export const TeacherView: FC = () => {
	return (
		<section className='p-4 w-full'>
			<Heading align='left' size='h2'>
				Мои награды
			</Heading>

			{/* top block */}
			<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] mt-4'>
				<HeroCard />
				<CreateCard />
			</div>

			{/* table */}
			<AwardsTable awards={mockAwards} className='mt-4' />
		</section>
	)
}
