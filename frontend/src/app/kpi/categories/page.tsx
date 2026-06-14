'use client'

import { CategoryCard, Loader, PageTitle, PageTitleActions, withNavAccess } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

const Page = () => {
	const { data: categories, isLoading } = useQuery({ ...services.categories.getAllOptions() })

	if (isLoading) {
		return <Loader type='data' />
	}

	return (
		<section className='mx-auto w-full max-w-6xl space-y-6 p-4'>
			<PageTitle
				sticky
				actions={
					<PageTitleActions
						actions={[{ id: 'create', label: 'Создать', icon: Plus, href: '/kpi/categories/create' }]}
						moreLabel='Дополнительные действия'
					/>
				}
				description='Список категорий для KPI достижений'
			>
				Категории
			</PageTitle>

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
		</section>
	)
}

export default withNavAccess(Page)
