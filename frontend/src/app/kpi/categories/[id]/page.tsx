'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle } from '@components'
import { getCategoryIconOptionByName, hasRole } from '@helpers'
import { services } from '@services'
import { Badge, Button, ButtonGroup, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum } from '@types'
import { Edit, Folder, Plus } from 'lucide-react'

const AWARDS_FETCH_SIZE = 500
const AWARDS_PAGE_SIZE = 10

const Page = () => {
	const params = useParams<{ id: string }>()
	const categoryId = params.id
	const { user, authLoading } = useAuthStore()

	const [currentPage, setCurrentPage] = useState(1)

	const { data: category, isLoading: isCategoryLoading } = useQuery({
		...services.categories.getByIdOptions(categoryId),
		enabled: !!categoryId,
	})

	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: 1,
			pageSize: AWARDS_FETCH_SIZE,
		}),
		enabled: !!categoryId,
	})

	const { data: awardTypes } = useQuery({
		...services.award.getAllTypesOptions(),
		enabled: !!categoryId,
	})

	const filteredAwards = useMemo(() => {
		const awards = awardsData?.data || []
		const categoryAwardTypes = category?.awardTypes || []

		if (!categoryAwardTypes.length) return []

		const allowedTypeIds = new Set(categoryAwardTypes)

		return awards.filter((award) => allowedTypeIds.has(award.type.id))
	}, [awardsData?.data, category?.awardTypes])

	const totalPages = Math.max(1, Math.ceil(filteredAwards.length / AWARDS_PAGE_SIZE))

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const paginatedAwards = useMemo(() => {
		const start = (currentPage - 1) * AWARDS_PAGE_SIZE

		return filteredAwards.slice(start, start + AWARDS_PAGE_SIZE)
	}, [currentPage, filteredAwards])

	const categoryAwardTypeNames = useMemo(() => {
		if (category?.awardTypesExpanded?.length) {
			return category.awardTypesExpanded.map((type) => type.name)
		}

		if (!category?.awardTypes?.length) return []

		const awardTypeNameById = new Map((awardTypes || []).map((type) => [type.id, type.name]))

		return category.awardTypes.map((typeId) => awardTypeNameById.get(typeId) || typeId)
	}, [awardTypes, category?.awardTypes, category?.awardTypesExpanded])

	if (isCategoryLoading || isAwardsLoading || authLoading) {
		return <Loader type='data' />
	}

	if (!category) {
		return <p className='p-6 text-center text-muted-foreground'>Категория не найдена</p>
	}

	const categoryIconOption = getCategoryIconOptionByName(category.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const isAdmin = user ? hasRole(user.role, RoleEnum.ADMIN) : false

	return (
		<section className='p-4 w-full max-w-6xl mx-auto space-y-6'>
			<PageTitle
				sticky
				actions={
					<ButtonGroup>
						{isAdmin && (
							<Button asChild size='sm' variant='outline'>
								<Link href={`/kpi/categories/${category.id}/edit`}>
									<Edit className='mr-2 h-4 w-4' />
									Редактировать
								</Link>
							</Button>
						)}
						<Button asChild size='sm'>
							<Link href={`/kpi/categories/${category.id}/create`}>
								<Plus className='mr-2 h-4 w-4' />
								Создать
							</Link>
						</Button>
					</ButtonGroup>
				}
				backHref='/kpi/categories'
				description='Категория и список связанных достижений'
			>
				{category.name}
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-3'>
						<CategoryIcon className='h-6 w-6 text-primary' />
						<span>{category.name}</span>
					</CardTitle>
					<CardDescription>{category.description || 'Описание отсутствует'}</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex flex-wrap gap-2'>
						{categoryAwardTypeNames.length ? (
							categoryAwardTypeNames.map((typeName) => (
								<Badge key={typeName} variant='secondary'>
									{typeName}
								</Badge>
							))
						) : (
							<Badge variant='outline'>Типы наград не указаны</Badge>
						)}
					</div>
					<div className='text-sm text-muted-foreground'>
						Полей в категории:{' '}
						<span className='font-medium text-foreground'>{category.fieldsExpanded?.length || 0}</span>
					</div>
				</CardContent>
			</Card>

			<div className='mx-auto w-full'>
				<AwardsCard
					awards={paginatedAwards}
					currentPage={currentPage}
					description='Список достижений, относящихся к этой категории'
					isLoading={false}
					title='Данные KPI категории'
					totalPages={totalPages}
					onPageChange={setCurrentPage}
				/>
			</div>
		</section>
	)
}

export default Page
