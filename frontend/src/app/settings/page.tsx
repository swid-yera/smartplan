'use client'

import { PageTitle, withRole } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useMutation } from '@tanstack/react-query'
import { RoleEnum } from '@types'
import { toast } from 'sonner'

import localeDictionary from './locale.json'
import { SyncGroupsCard } from './sync-card'

function GroupsPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	// mutations
	const { mutate: syncGroups, isPending } = useMutation({
		...services.group.syncOptions(),

		onSuccess: () => {
			toast.success(t.toastSuccess)
		},
		onError: () => {
			toast.error(t.toastError)
		},
	})

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description={t.pageDescription}>{t.pageTitle}</PageTitle>

			<SyncGroupsCard loading={isPending} onSync={syncGroups} />
		</section>
	)
}

export default withRole(GroupsPage, [RoleEnum.ADMIN])
