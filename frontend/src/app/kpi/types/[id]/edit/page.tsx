'use client'

import type { NextPage } from 'next'
import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ICreateTypesRequest } from '@types'
import { toast } from 'sonner'

import { EditCard } from '../../components'

const Page: NextPage = () => {
	const { id } = useParams()
	const { replace } = useRouter()

	const { data: typeData, isLoading } = useQuery({ ...services.award.getTypeByIdOptions(id as string), enabled: !!id })
	const { mutate } = useMutation({ ...services.award.updateTypeOptions() })

	if (!typeData || isLoading) return <Loader />

	const onSubmit = (changedType: ICreateTypesRequest) => {
		const typeName = changedType.name
		const toastId = `create-type-${typeName}`

		toast.loading(`Создание ${typeName}`, { id: toastId })

		mutate(
			{ id: typeData.id, changedType },
			{
				onSuccess: (createdType) => {
					toast.success(`${createdType.name} успешно создан`, { id: toastId })
					replace(`/kpi/types/${createdType.id}`)
				},
				onError: (err) => {
					toast.error(`Произошла ошибка при обновлений ${typeName}`, {
						id: toastId,
						description: err.message,
					})
				},
			},
		)
	}

	return (
		<section className='mx-auto w-full p-6'>
			<PageTitle backHref={`/kpi/types/${typeData.id}`} description='Редактирование критерия оценивания'>
				{typeData.name}
			</PageTitle>

			<EditCard type={typeData} onSubmit={onSubmit} />
		</section>
	)
}

export default Page
