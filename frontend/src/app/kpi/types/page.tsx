'use client'

import Link from 'next/link'

import { Loader, PageTitle, withRole } from '@components'
import { services } from '@services'
import { Button } from '@shadcn'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum } from '@types'
import { Plus } from 'lucide-react'

import { TypesList } from './types-list'

const Page = () => {
	const { data, isLoading } = useQuery({ ...services.award.getAllTypesOptions(), enabled: true })

	if (isLoading) return <Loader />

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

			<TypesList types={data || []} />
		</section>
	)
}

export default withRole(Page, [RoleEnum.ADMIN])
