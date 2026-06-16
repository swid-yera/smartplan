'use client'

import { CategoryCard, Loader, PageTitle, withNavAccess } from '@components'
import { formatDateOnly, getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Card, CardContent } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'

import localeDictionary from './locale.json'

const Page = () => {
	const { user, authLoading } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const { data: categories, isLoading: isCategoriesLoading } = useQuery({
		...services.categories.getAllOptions(),
		enabled: !!user,
	})

	const { data: kpiLock } = useQuery({
		...services.kpiSettings.getUploadBlockDateOptions(),
		enabled: !!user,
	})

	if (!user || authLoading || isCategoriesLoading) return <Loader type='data' />

	const lockMessage = kpiLock?.blockedAfterDate
		? t.uploadLockMessage.replace('{date}', formatDateOnly(kpiLock.blockedAfterDate, locale))
		: ''

	return (
		<section className='p-4 max-w-6xl w-full mx-auto space-y-6'>
			<PageTitle backHref='back' description={t.inputDescription}>
				{t.inputTitle}
			</PageTitle>

			<div className='space-y-4'>
				{categories?.length ? (
					<div className='mx-auto w-full max-w-4xl'>
						<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
							{categories.map((category) => (
								<CategoryCard key={category.id} category={category} />
							))}
						</div>
					</div>
				) : (
					<div className='flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground'>
						{t.empty}
					</div>
				)}
			</div>

			{kpiLock?.blockedAfterDate ? (
				<Card className='border-dashed border-amber-500/30 bg-amber-500/5'>
					<CardContent className='p-4 text-sm text-amber-950 dark:text-amber-100'>{lockMessage}</CardContent>
				</Card>
			) : null}
		</section>
	)
}

export default withNavAccess(Page)
