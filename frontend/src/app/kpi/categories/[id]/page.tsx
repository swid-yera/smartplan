'use client'

import { useMemo } from 'react'

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
	AwardsCard,
	Loader,
	PageTitle,
	type PageTitleAction,
	PageTitleActions,
	Pagination,
	withPermission,
} from '@components'
import {
	getCategoryIconOptionByName,
	getLocaleText,
	getUILocaleSection,
	hasAnyPermission,
	hasPermission,
} from '@helpers'
import { services } from '@services'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Switch } from '@shadcn'
import { useAuthStore, useLocaleStore, usePaginationSettingsStore } from '@store'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum, StatusEnum } from '@types'
import { Edit, Folder, Plus } from 'lucide-react'

import { AwardFilterCard } from '../../components'
import { useCategoryAwardsScope } from './award-scope-state'
import localeDictionary from './locale.json'

const Page = () => {
	const params = useParams<{ id: string }>()
	const categoryId = params.id
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()
	const { user, authLoading } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const canManageAwards = hasAnyPermission(user, [PermissionCodeEnum.KPI_MANAGE])
	const canFullAwards = hasPermission(user, PermissionCodeEnum.KPI_FULL)
	const canViewAwards = hasAnyPermission(user, [PermissionCodeEnum.KPI_FULL, PermissionCodeEnum.KPI_VIEW])
	const canManageOnlyAwards = canManageAwards && !canFullAwards
	const {
		isReady: isScopeReady,
		scope,
		setAwardsScope,
	} = useCategoryAwardsScope({
		canFullAwards,
		canManageOnlyAwards,
	})
	const showAllAwards = canManageOnlyAwards || scope === 'all'
	const page = Number(searchParams.get('page')) || 1
	const storedPageSize = usePaginationSettingsStore((state) => state.pageSize)
	const setStoredPageSize = usePaginationSettingsStore((state) => state.setPageSize)
	const pageSize = Number(searchParams.get('pageSize')) || storedPageSize
	const sortParam = searchParams.get('sort')
	const statusParam = searchParams.get('status') ?? ''
	const sort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : 'desc'
	const defaultStatuses =
		canManageOnlyAwards || (canFullAwards && showAllAwards)
			? [StatusEnum.IN_REVIEW, StatusEnum.APPROVED]
			: ([] as StatusEnum[])
	const status = statusParam
		? (statusParam
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean) as StatusEnum[])
		: defaultStatuses.length
			? defaultStatuses
			: undefined
	const showAllAwardsInQuery = showAllAwards
	const teacher = showAllAwardsInQuery ? undefined : user?.keycloakId

	const { data: category, isLoading: isCategoryLoading } = useQuery({
		...services.categories.getByIdOptions(categoryId),
		enabled: !!categoryId,
	})

	const { data: awardsData, isLoading: isAwardsLoading } = useQuery({
		placeholderData: keepPreviousData,
		...services.award.getAllOptions({
			currentPage: page,
			pageSize,
			sort,
			status,
			teacher,
			categoryId,
		}),
		enabled: !!categoryId && !!user && !authLoading && (!canFullAwards || isScopeReady),
	})

	const { data: awardTypes } = useQuery({
		...services.award.getAllTypesOptions(),
		enabled: !!categoryId,
	})

	const awards = awardsData?.data || []
	const totalPages = awardsData?.meta.pages || 1

	const categoryAwardTypeNames = useMemo(() => {
		if (category?.awardTypesExpanded?.length) {
			return category.awardTypesExpanded.map((type) => getLocaleText(type.name, locale))
		}

		if (!category?.awardTypes?.length) return []

		const awardTypeNameById = new Map((awardTypes || []).map((type) => [type.id, getLocaleText(type.name, locale)]))

		return category.awardTypes.map((typeId) => awardTypeNameById.get(typeId) || typeId)
	}, [locale, awardTypes, category?.awardTypes, category?.awardTypesExpanded])

	if (isCategoryLoading || isAwardsLoading || authLoading || (canFullAwards && !isScopeReady)) {
		return <Loader type='data' />
	}

	if (!category) {
		return <p className='p-6 text-center text-muted-foreground'>{t.notFound}</p>
	}

	const categoryIconOption = getCategoryIconOptionByName(category.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const canEditCategories = hasAnyPermission(user, [PermissionCodeEnum.KPI_FULL])
	const pageActions: PageTitleAction[] = [
		canViewAwards && {
			id: 'create',
			label: t.create,
			icon: Plus,
			href: `/kpi/categories/${category.id}/create`,
			priority: 'primary',
		},
		canEditCategories && {
			id: 'edit',
			label: t.edit,
			icon: Edit,
			href: `/kpi/categories/${category.id}/edit`,
			priority: 'overflow',
		},
	].filter(Boolean) as PageTitleAction[]
	const categoryName = getLocaleText(category.name, locale)
	const categoryDescription = getLocaleText(category.description, locale) || t.missingDescription
	const awardsDescription = showAllAwardsInQuery ? t.awardsAllDescription : t.awardsOwnDescription

	const updateSearchParams = (nextParams: Record<string, string | number | null>) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		for (const [key, value] of Object.entries(nextParams)) {
			if (value === null || value === '') {
				paramsUrl.delete(key)
				continue
			}

			paramsUrl.set(key, String(value))
		}

		router.push(`${pathname}?${paramsUrl.toString()}`, { scroll: false })
	}

	const setCurrentPage = (nextPage: number) => {
		updateSearchParams({ page: nextPage })
	}

	const setPageSize = (nextPageSize: number) => {
		setStoredPageSize(nextPageSize)
		updateSearchParams({ pageSize: nextPageSize, page: 1 })
	}

	return (
		<section className='p-4 w-full max-w-6xl mx-auto space-y-6'>
			<PageTitle
				sticky
				actions={<PageTitleActions actions={pageActions} moreLabel={t.moreActions} />}
				backHref='back'
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
				</CardContent>
			</Card>

			{canFullAwards ? (
				<div className='flex mb-4 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<div className='space-y-1'>
						<div className='flex items-center gap-2'>
							<p className='text-sm font-medium'>{showAllAwardsInQuery ? t.awardsAllTitle : t.awardsOwnTitle}</p>
						</div>
					</div>

					<div className='flex items-center gap-3'>
						<Label className='text-sm text-muted-foreground' htmlFor='category-awards-scope'>
							{t.awardsScopeLabel}
						</Label>
						<Switch checked={showAllAwards} id='category-awards-scope' onCheckedChange={setAwardsScope} />
					</div>
				</div>
			) : null}

			<AwardFilterCard compact hideCategoryFilter className='mb-2' defaultStatuses={defaultStatuses} />
			<div className='mx-auto w-full'>
				<AwardsCard
					awards={awards}
					description={awardsDescription}
					isLoading={isAwardsLoading}
					title={t.awardsTitle}
				/>
				<Pagination
					page={awardsData?.meta.currentPage || page}
					pageSize={awardsData?.meta.pageSize || pageSize}
					pageSizeOptions={[10, 20, 50]}
					totalPages={totalPages}
					onPageChange={setCurrentPage}
					onPageSizeChange={setPageSize}
				/>
			</div>
		</section>
	)
}

export default withPermission(Page, [
	PermissionCodeEnum.KPI_FULL,
	PermissionCodeEnum.KPI_VIEW,
	PermissionCodeEnum.KPI_MANAGE,
])
