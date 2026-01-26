'use client'

import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { services } from '@services'
import { useMutation } from '@tanstack/react-query'
import type { ICreateTypesRequest } from '@types'
import { toast } from 'sonner'

import { EditCard } from '../components'

const Page: NextPage = () => {
	const { replace } = useRouter()

	const { mutate } = useMutation({ ...services.award.createTypeOptions() })

	const onSubmit = (newType: ICreateTypesRequest) => {
		const typeName = newType.name
		const toastId = `create-type-${typeName}`

		toast.loading(`Создание ${typeName}`, { id: toastId })

		mutate(
			{ newType: newType },
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
			<PageTitle backHref='/kpi/types' description='Просмотр всех критериев оценивания'>
				Создание критерия оценивания
			</PageTitle>

			<EditCard onSubmit={onSubmit} />
		</section>
	)
}

export default Page
