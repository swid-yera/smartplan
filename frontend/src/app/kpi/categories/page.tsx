import Link from 'next/link'

import { CategoryCard, Forbidden, PageTitle } from '@components'
import { getServerAuthUser, serverFetchJson } from '@lib/server'
import { Button } from '@shadcn'
import type { ICategoryListItemResponse } from '@types'
import { RoleEnum } from '@types'
import { Plus } from 'lucide-react'

export default async function CategoriesPage() {
	const user = await getServerAuthUser()

	if (!user || user.role !== RoleEnum.ADMIN) {
		return <Forbidden />
	}

	const categories = await serverFetchJson<ICategoryListItemResponse[]>('/categories', {
		includeSid: true,
		revalidate: 300,
	})

	return (
		<section className='mx-auto w-full max-w-6xl space-y-6 p-4'>
			<PageTitle
				sticky
				actions={
					<Button asChild>
						<Link href='/kpi/categories/create'>
							<Plus className='mr-2 h-4 w-4' />
							Создать
						</Link>
					</Button>
				}
				description='Список категорий для KPI достижений'
			>
				Категории
			</PageTitle>

			{categories.length ? (
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
