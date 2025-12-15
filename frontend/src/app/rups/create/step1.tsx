import type { FC } from 'react'

import { BasicDataCard, ExplorationNoteCard, GoalsCard, GroupCard } from '../components'

export const Step1: FC = () => {
	return (
		<div className='w-full space-y-5'>
			<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]'>
				<BasicDataCard />
				<ExplorationNoteCard />
			</div>

			<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]'>
				<GoalsCard />
				<GroupCard />
			</div>
		</div>
	)
}
