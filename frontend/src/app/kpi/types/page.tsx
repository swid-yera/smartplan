'use client'

import Link from 'next/link'

import { Loader, PageTitle, withNavAccess } from '@components'
import { services } from '@services'
import { Button } from '@shadcn'
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
					<Button asChild>
						<Link href='/kpi/types/create'>
							<Plus className='mr-2 h-4 w-4' />
							Создать
						</Link>
					</Button>
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
