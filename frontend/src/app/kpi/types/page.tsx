'use client'

import { Loader, PageTitle, PageTitleActions, withNavAccess } from '@components'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { TypesList } from './types-list'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const { data: types, isLoading } = useQuery({
		...services.award.getAllTypesOptions(),
	})

	if (isLoading) {
		return <Loader type='data' />
	}

	return (
		<section className='p-4 w-full space-y-6'>
			<PageTitle
				sticky
				actions={
					<PageTitleActions
						actions={[{ id: 'create', label: 'Создать', icon: Plus, href: '/kpi/types/create' }]}
						moreLabel='Дополнительные действия'
					/>
				}
				description='Критерий оценивание'
			>
				Критерий оценивание
			</PageTitle>

			<TypesList locale={locale} types={types || []} />
		</section>
	)
}

export default withNavAccess(Page)
