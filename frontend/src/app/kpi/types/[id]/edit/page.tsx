'use client'

import { useState } from 'react'

import type { NextPage } from 'next'
import { useParams, useRouter } from 'next/navigation'

import { Loader, withPermission } from '@components'
import { getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type ICreateTypesRequest, type Locale, PermissionCodeEnum } from '@types'
import { toast } from 'sonner'

import { TypeEditorLayout } from '../../components'
import localeDictionary from './locale.json'

const Page: NextPage = () => {
	const { id } = useParams()
	const { replace } = useRouter()
	const [activeLocale, setActiveLocale] = useState<Locale>('ru')
	const t = getUILocaleSection(localeDictionary, activeLocale)

	const { data: typeData, isLoading } = useQuery({ ...services.award.getTypeByIdOptions(id as string), enabled: !!id })
	const { mutate } = useMutation({ ...services.award.updateTypeOptions() })

	if (!typeData || isLoading) return <Loader />

	const onSubmit = (changedType: ICreateTypesRequest) => {
		const typeName = getLocaleText(changedType.name, activeLocale)
		const toastId = `create-type-${typeName}`

		toast.loading(interpolateUILocaleText(t.toastCreating, { name: typeName }), { id: toastId })

		mutate(
			{ id: typeData.id, changedType },
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
			backHref={`/kpi/types/${typeData.id}`}
			description={t.description}
			langKkLabel={t.langKk}
			langRuLabel={t.langRu}
			title={getLocaleText(typeData.name, activeLocale)}
			type={typeData}
			onLocaleChange={setActiveLocale}
			onSubmit={onSubmit}
		/>
	)
}

export default withPermission(Page, [PermissionCodeEnum.KPI_FULL])
