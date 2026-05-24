'use client'

import { useState } from 'react'

import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { getLocaleText } from '@helpers'
import { services } from '@services'
import { Tabs, TabsList, TabsTrigger } from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import type { ICreateTypesRequest, Locale } from '@types'
import { toast } from 'sonner'

import { EditCard } from '../components'

const Page: NextPage = () => {
	const { replace } = useRouter()
	const [activeLocale, setActiveLocale] = useState<Locale>('ru')

	const { mutate } = useMutation({ ...services.award.createTypeOptions() })

	const onSubmit = (newType: ICreateTypesRequest) => {
		const typeName = getLocaleText(newType.name, activeLocale)
		const toastId = `create-type-${typeName}`

		toast.loading(`Создание ${typeName}`, { id: toastId })

		mutate(
			{ newType: newType },
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
				backHref='/kpi/types'
				description='Просмотр всех критериев оценивания'
			>
				Создание критерия оценивания
			</PageTitle>

			<EditCard activeLocale={activeLocale} onSubmit={onSubmit} />
		</section>
	)
}

export default Page
