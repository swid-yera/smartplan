import Link from 'next/link'

import { Forbidden, PageTitle } from '@components'
import { getCategoryIconOptionByName, getLocaleText, getUILocaleSection } from '@helpers'
import { getServerAuthUser, getServerLocale, serverFetchJson } from '@lib/server'
import { Badge, Button, ButtonGroup, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import type { IAward, ICategoryResponse, IPagination, ITypeResponse } from '@types'
import { RoleEnum } from '@types'
import { Edit, Folder, Plus } from 'lucide-react'

import { CategoryAwardsClient } from './category-awards-client'
import localeDictionary from './locale.json'

const AWARDS_FETCH_SIZE = 500

type PageParams = {
	params: Promise<{
		id: string
	}>
}

const buildQueryString = (entries: Array<[string, string | undefined]>) => {
	const searchParams = new URLSearchParams()

	for (const [key, value] of entries) {
		if (!value) continue
		searchParams.set(key, value)
	}

	return searchParams.toString()
}

export default async function CategoryPage({ params }: PageParams) {
	const [user, locale] = await Promise.all([getServerAuthUser(), getServerLocale()])
	const { id: categoryId } = await params

	if (!user || user.role !== RoleEnum.ADMIN) {
		return <Forbidden />
	}

	const t = getUILocaleSection(localeDictionary, locale)

	const awardsQuery = buildQueryString([
		['currentPage', '1'],
		['pageSize', String(AWARDS_FETCH_SIZE)],
		['teacher', user.keycloakId],
		['categoryId', categoryId],
		['locale', locale],
	])

	const [categoryResult, awardsResult, awardTypesResult] = await Promise.allSettled([
		serverFetchJson<ICategoryResponse>(`/categories/${categoryId}`, {
			includeSid: true,
			revalidate: 300,
		}),
		serverFetchJson<IPagination<IAward>>(`/awards?${awardsQuery}`, {
			includeSid: true,
			revalidate: 300,
		}),
		serverFetchJson<ITypeResponse[]>(`/awards/types?locale=${locale}`, {
			includeSid: true,
			revalidate: 300,
		}),
	])

	if (categoryResult.status !== 'fulfilled') {
		return (
			<section className='mx-auto flex w-full max-w-6xl items-center justify-center p-6'>
				<p className='text-center text-muted-foreground'>{t.notFound}</p>
			</section>
		)
	}

	const category = categoryResult.value
	const awards = awardsResult.status === 'fulfilled' ? awardsResult.value.data : []
	const awardTypes = awardTypesResult.status === 'fulfilled' ? awardTypesResult.value : []
	const categoryAwardTypes = category.awardTypes || []
	const filteredAwards =
		categoryAwardTypes.length > 0 ? awards.filter((award) => categoryAwardTypes.includes(award.type.id)) : []
	const categoryAwardTypeNames = (() => {
		if (category.awardTypesExpanded?.length) {
			return category.awardTypesExpanded.map((type) => getLocaleText(type.name, locale))
		}

		if (!categoryAwardTypes.length) return []

		const awardTypeNameById = new Map(awardTypes.map((type) => [type.id, getLocaleText(type.name, locale)]))

		return categoryAwardTypes.map((typeId) => awardTypeNameById.get(typeId) || typeId)
	})()

	const categoryIconOption = getCategoryIconOptionByName(category.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const isAdmin = user.role === RoleEnum.ADMIN
	const categoryName = getLocaleText(category.name, locale)
	const categoryDescription = getLocaleText(category.description, locale) || t.missingDescription

	return (
		<section className='mx-auto w-full max-w-6xl space-y-6 p-4'>
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

			<CategoryAwardsClient awards={filteredAwards} description={t.awardsDescription} title={t.awardsTitle} />
		</section>
	)
}
