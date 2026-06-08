'use client'

import { CategoryCard, Loader, SectionTitle, withRole } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum } from '@types'

import localeDictionary from './locale.json'

const Page = () => {
	const { user, authLoading } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const { data: categories, isLoading: isCategoriesLoading } = useQuery({
		...services.categories.getAllOptions(),
		enabled: !!user,
	})

	if (!user || authLoading || isCategoriesLoading) return <Loader type='data' />

	return (
		<section className='p-4 max-w-6xl w-full mx-auto space-y-6'>
			<SectionTitle description={t.inputDescription} title={t.inputTitle} />

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
		</section>
	)
}

export default withRole(Page, [RoleEnum.TEACHER])
