'use client'

import { CategoryCard, Loader, SectionTitle } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'

import { UserCard } from '../../users/[id]/user-card'

const MethodistAwardsPage = () => {
	const { user, authLoading } = useAuthStore()

	const { data: categories, isLoading: isCategoriesLoading } = useQuery({
		...services.categories.getAllOptions(),
		enabled: !!user,
	})

	if (!user || authLoading || isCategoriesLoading) return <Loader type='data' />

	return (
		<section className='p-4 max-w-6xl w-full mx-auto space-y-6'>
			<SectionTitle description='Профиль и категории KPI' title='Мой KPI профиль' />

			<UserCard user={user} />

			<div className='space-y-4'>
				<div className='flex items-center justify-between gap-4'>
					<SectionTitle
						className='flex-1'
						description='Выберите категорию для создания данных для KPI'
						title='Ввод данных'
					/>
				</div>

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
						Категории пока не созданы
					</div>
				)}
			</div>
		</section>
	)
}

export default MethodistAwardsPage
