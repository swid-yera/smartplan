'use client'

import { useState } from 'react'

import type { NextPage } from 'next'
import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle } from '@components'
import { getLocaleText } from '@helpers'
import { services } from '@services'
import { Tabs, TabsList, TabsTrigger } from '@shadcn'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ICreateTypesRequest, Locale } from '@types'
import { toast } from 'sonner'

import { EditCard } from '../../components'

const Page: NextPage = () => {
	const { id } = useParams()
	const { replace } = useRouter()
	const [activeLocale, setActiveLocale] = useState<Locale>('ru')

	const { data: typeData, isLoading } = useQuery({ ...services.award.getTypeByIdOptions(id as string), enabled: !!id })
	const { mutate } = useMutation({ ...services.award.updateTypeOptions() })

	if (!typeData || isLoading) return <Loader />

	const onSubmit = (changedType: ICreateTypesRequest) => {
		const typeName = getLocaleText(changedType.name, activeLocale)
		const toastId = `create-type-${typeName}`

		toast.loading(`Создание ${typeName}`, { id: toastId })

		mutate(
			{ id: typeData.id, changedType },
			{
				onSuccess: (createdType) => {
					toast.success(`${getLocaleText(createdType.name, activeLocale)} успешно создан`, { id: toastId })
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
			<PageTitle
				sticky
				actions={
					<Tabs value={activeLocale} onValueChange={(value) => setActiveLocale(value as Locale)}>
						<TabsList>
							<TabsTrigger value='ru'>Русский</TabsTrigger>
							<TabsTrigger value='kk'>Қазақша</TabsTrigger>
						</TabsList>
					</Tabs>
				}
				backHref={`/kpi/types/${typeData.id}`}
				description='Редактирование критерия оценивания'
			>
				{getLocaleText(typeData.name, activeLocale)}
			</PageTitle>

			<EditCard activeLocale={activeLocale} type={typeData} onSubmit={onSubmit} />
		</section>
	)
}

export default Page
