import { Heading } from '@ui'

import { AwardsTable, CreateCard, HeroCard } from './components'
import { mockAwards } from './mock.data'

const Page = () => {
	return (
		<section className='p-4 w-full'>
			<Heading align='left' size='h2'>
				Награды
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

export default Page
