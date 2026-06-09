'use client'

import { GroupsCard, Loader, PageTitle, withNavAccess } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import settingsLocaleDictionary from '../settings/locale.json'
import { SyncGroupsCard } from '../settings/sync-card'
import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const syncT = getUILocaleSection(settingsLocaleDictionary, locale)

	const { data: groups, isLoading } = useQuery({
		...services.group.getAllOptions(),
	})

	const { mutate: syncGroups, isPending } = useMutation({
		...services.group.syncOptions(),
		onSuccess: () => {
			toast.success(syncT.toastSuccess)
		},
		onError: () => {
			toast.error(syncT.toastError)
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
