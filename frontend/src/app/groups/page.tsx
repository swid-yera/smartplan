'use client'

import { GroupsCard, Loader, PageTitle } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'

export default function GroupsPage() {
	// queries
	const { data: groups, isLoading } = useQuery({
		...services.group.getAllOptions(),
	})

	if (isLoading) return <Loader type='data' />

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description='Все группы'>Группы</PageTitle>

			{/* groups list */}
			<GroupsCard groups={groups || []} />
		</section>
	)
}
