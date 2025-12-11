import type { NextPage } from 'next'

import { Heading } from '@ui'

import { Filter } from './filter'
import { Rups } from './rups'

interface IPageProps {
	searchParams: {
		q?: string
		status?: string
		year?: string
		specialty?: string
	}
}

const Page: NextPage<IPageProps> = () => {
	return (
		<>
			<section className='max-w-6xl mx-auto px-4 py-6 space-y-4'>
				{/* heading */}
				<div>
					<Heading align='left' size='h1'>
						Все рабочие учебные планы
					</Heading>
					<p className='text-muted-foreground'>
						Реестр рабочих учебных планов с фильтрами по специальности, году и статусу.
					</p>
				</div>

				{/* filters */}
				<Filter items={[]} searchParams={{}} />

				{/* rups */}
				<Rups rups={[]} />
			</section>
		</>
	)
}

export default Page
