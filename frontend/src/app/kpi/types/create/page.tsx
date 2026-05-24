'use client'

import { useState } from 'react'

import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { Tabs, TabsList, TabsTrigger } from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import type { ICreateTypesRequest, Locale } from '@types'
import { toast } from 'sonner'

import { EditCard } from '../components'
import localeDictionary from './locale.json'

const Page: NextPage = () => {
	const { replace } = useRouter()
	const [activeLocale, setActiveLocale] = useState<Locale>('ru')
	const t = getUILocaleSection(localeDictionary, activeLocale)

	const { mutate } = useMutation({ ...services.award.createTypeOptions() })

	const onSubmit = (newType: ICreateTypesRequest) => {
		const typeName = getLocaleText(newType.name, activeLocale)
		const toastId = `create-type-${typeName}`

		toast.loading(interpolateUILocaleText(t.toastCreating, { name: typeName }), { id: toastId })

		mutate(
			{ newType: newType },
			{
				onSuccess: (createdType) => {
					toast.success(interpolateUILocaleText(t.toastCreated, { name: getLocaleText(createdType.name, activeLocale) }), {
						id: toastId,
					})
					replace(`/kpi/types/${createdType.id}`)
				},
				onError: (err) => {
					toast.error(interpolateUILocaleText(t.toastError, { name: typeName }), {
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
							<TabsTrigger value='ru'>{t.langRu}</TabsTrigger>
							<TabsTrigger value='kk'>{t.langKk}</TabsTrigger>
						</TabsList>
					</Tabs>
				}
				backHref='/kpi/types'
				description={t.description}
			>
				{t.title}
			</PageTitle>

			<EditCard activeLocale={activeLocale} onSubmit={onSubmit} />
		</section>
	)
}

export default Page
