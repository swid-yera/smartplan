'use client'

import type { NextPage } from 'next'
import { useParams } from 'next/navigation'

import { Loader } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'

import { TypeView } from './type-view'

const Page: NextPage = () => {
	const params = useParams<{ id: string }>()
	const id = params.id

	const { data, isLoading } = useQuery({
		...services.award.getTypeByIdOptions(id),
		enabled: !!id,
	})

	if (isLoading) {
		return <Loader type='default' />
	}

	if (!data) {
		return <p className='p-6 text-center text-muted-foreground'>Критерии оценивания не найден</p>
	}

	return <TypeView type={data} />
}

export default Page
