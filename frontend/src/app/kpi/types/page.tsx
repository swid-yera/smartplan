import Link from 'next/link'

import { Forbidden, PageTitle } from '@components'
import { getServerAuthUser, getServerLocale, serverFetchJson } from '@lib/server'
import { Button } from '@shadcn'
import type { ITypeResponse } from '@types'
import { RoleEnum } from '@types'
import { Plus } from 'lucide-react'

import { TypesList } from './types-list'

export default async function TypesPage() {
	const [user, locale] = await Promise.all([getServerAuthUser(), getServerLocale()])

	if (!user || user.role !== RoleEnum.ADMIN) {
		return <Forbidden />
	}

	const data = await serverFetchJson<ITypeResponse[]>(`/awards/types?locale=${locale}`, {
		includeSid: true,
		revalidate: 300,
	})

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

			<TypesList locale={locale} types={data} />
		</section>
	)
}
