'use client'

import { GroupsCard, Loader, PageTitle, withNavAccess } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import localeDictionary from './locale.json'
import { SyncGroupsCard } from './sync-card'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const { data: groups, isLoading } = useQuery({
		...services.group.getAllOptions(),
	})

	const { mutate: syncGroups, isPending } = useMutation({
		...services.group.syncOptions(),
		onSuccess: () => {
			toast.success(t.toastSuccess)
		},
		onError: () => {
			toast.error(t.toastError)
		},
	})

	if (isLoading) return <Loader type='data' />

	return (
		<section className='mx-auto w-full max-w-5xl space-y-6 p-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<SyncGroupsCard loading={isPending} onSync={syncGroups} />

			<GroupsCard groups={groups || []} />
		</section>
	)
}

export default withNavAccess(Page)
