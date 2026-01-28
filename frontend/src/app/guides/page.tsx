import { PageTitle } from '@components'

import { GuidesList } from './guides-list'

export default function GuidesPage() {
	return (
		<section className='mx-auto w-full max-w-6xl p-6 space-y-6'>
			<PageTitle description='Материал для обучения'>Гайды</PageTitle>

			<GuidesList />
		</section>
	)
}
