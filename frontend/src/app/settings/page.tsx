'use client'

import { PageTitle } from '@components'
import { services } from '@services'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { SyncGroupsCard } from './sync-card'

export default function GroupsPage() {
	// mutations
	const { mutate: syncGroups, isPending } = useMutation({
		...services.group.syncOptions(),

		onSuccess: () => {
			toast.success('Группы успешно синхронизированы')
		},
		onError: () => {
			toast.error('Ошибка синхронизации групп')
		},
	})

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description='Все группы с возможностью синхронизаций'>Синхронизация групп</PageTitle>

			<SyncGroupsCard loading={isPending} onSync={syncGroups} />
		</section>
	)
}
