'use client'

import { useParams } from 'next/navigation'

import { Loader, withPermission } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum } from '@types'

import { TypeView } from './type-view'

const Page = () => {
	const { id } = useParams<{ id: string }>()
	const { data: typeData, isLoading } = useQuery({
		...services.award.getTypeByIdOptions(id || ''),
		enabled: !!id,
	})

	if (isLoading) {
		return <Loader />
	}

	if (!typeData) {
		return <p className='p-6 text-center text-muted-foreground'>Критерии оценивания не найден</p>
	}

	return <TypeView type={typeData} />
}

export default withPermission(Page, [PermissionCodeEnum.KPI_FULL])
