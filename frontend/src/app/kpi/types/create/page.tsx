'use client'

import { useState } from 'react'

import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'

import { withRole } from '@components'
import { getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { useMutation } from '@tanstack/react-query'
import type { ICreateTypesRequest, Locale } from '@types'
import { RoleEnum } from '@types'
import { toast } from 'sonner'

import { TypeEditorLayout } from '../components'
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
					toast.success(
						interpolateUILocaleText(t.toastCreated, { name: getLocaleText(createdType.name, activeLocale) }),
						{
							id: toastId,
						},
					)
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
		<TypeEditorLayout
			activeLocale={activeLocale}
			backHref='/kpi/types'
			description={t.description}
			langKkLabel={t.langKk}
			langRuLabel={t.langRu}
			title={t.title}
			onLocaleChange={setActiveLocale}
			onSubmit={onSubmit}
		/>
	)
}

export default withRole(Page, [RoleEnum.ADMIN])
