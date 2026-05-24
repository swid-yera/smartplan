'use client'

import { GroupsCard, Loader, PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'

import localeDictionary from './locale.json'

export default function GroupsPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	// queries
	const { data: groups, isLoading } = useQuery({
		...services.group.getAllOptions(),
	})

	if (isLoading) return <Loader type='data' />

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			{/* groups list */}
			<GroupsCard groups={groups || []} />
		</section>
	)
}
