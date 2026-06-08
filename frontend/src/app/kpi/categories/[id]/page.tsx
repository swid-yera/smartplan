'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { AwardsCard, Loader, PageTitle, withRole } from '@components'
import { getCategoryIconOptionByName, getLocaleText, getUILocaleSection, hasRole } from '@helpers'
import { services } from '@services'
import { Badge, Button, ButtonGroup, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum } from '@types'
import { Edit, Folder, Plus } from 'lucide-react'

import localeDictionary from './locale.json'

const AWARDS_FETCH_SIZE = 500
const AWARDS_PAGE_SIZE = 10

const Page = () => {
	const params = useParams<{ id: string }>()
	const categoryId = params.id
	const { user, authLoading } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const [currentPage, setCurrentPage] = useState(1)

	const { data: category, isLoading: isCategoryLoading } = useQuery({
		...services.categories.getByIdOptions(categoryId),
		enabled: !!categoryId,
	})

	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		...services.award.getAllOptions({
			currentPage: 1,
			pageSize: AWARDS_FETCH_SIZE,
			teacher: user?.keycloakId,
			categoryId,
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
			return category.awardTypesExpanded.map((type) => getLocaleText(type.name, locale))
		}

		if (!category?.awardTypes?.length) return []

		const awardTypeNameById = new Map((awardTypes || []).map((type) => [type.id, getLocaleText(type.name, locale)]))

		return category.awardTypes.map((typeId) => awardTypeNameById.get(typeId) || typeId)
	}, [locale, awardTypes, category?.awardTypes, category?.awardTypesExpanded])

	if (isCategoryLoading || isAwardsLoading || authLoading) {
		return <Loader type='data' />
	}

	if (!category) {
		return <p className='p-6 text-center text-muted-foreground'>{t.notFound}</p>
	}

	const categoryIconOption = getCategoryIconOptionByName(category.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const isAdmin = user ? hasRole(user.role, RoleEnum.ADMIN) : false
	const categoryName = getLocaleText(category.name, locale)
	const categoryDescription = getLocaleText(category.description, locale) || t.missingDescription

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
									{t.edit}
								</Link>
							</Button>
						)}
						<Button asChild size='sm'>
							<Link href={`/kpi/categories/${category.id}/create`}>
								<Plus className='mr-2 h-4 w-4' />
								{t.create}
							</Link>
						</Button>
					</ButtonGroup>
				}
				backHref='/kpi/entry'
				description={t.pageDescription}
			>
				{categoryName}
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-3'>
						<CategoryIcon className='h-6 w-6 text-primary' />
						<span>{categoryName}</span>
					</CardTitle>
					<CardDescription>{categoryDescription}</CardDescription>
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
							<Badge variant='outline'>{t.typesEmpty}</Badge>
						)}
					</div>
					<div className='text-sm text-muted-foreground'>
						{t.fieldsCount}{' '}
						<span className='font-medium text-foreground'>{category.fieldsExpanded?.length || 0}</span>
					</div>
				</CardContent>
			</Card>

			<div className='mx-auto w-full'>
				<AwardsCard
					awards={paginatedAwards}
					currentPage={currentPage}
					description={t.awardsDescription}
					isLoading={false}
					title={t.awardsTitle}
					totalPages={totalPages}
					onPageChange={setCurrentPage}
				/>
			</div>
		</section>
	)
}

export default withRole(Page, [RoleEnum.ADMIN])
