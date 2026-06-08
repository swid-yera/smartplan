'use client'

import { CombineCard, Loader, PageTitle, StatusBadge } from '@components'
import { buildReviewItems, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQueries } from '@tanstack/react-query'
import { StatusEnum } from '@types'
import { CheckCircle, FileText } from 'lucide-react'

import localeDictionary from './locale.json'
import { StatCard } from './stat-card'

const reviewQueryParams = { currentPage: 1, pageSize: 10, status: [StatusEnum.IN_REVIEW], sort: 'desc' as const }
const allQueryParams = { currentPage: 1, pageSize: 50, sort: 'desc' as const }

export const MethodistDashboard = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).methodist
	const [reviewRupsQuery, reviewAwardsQuery, allRupsQuery, allAwardsQuery] = useQueries({
		queries: [
			services.rup.getAllOptions(reviewQueryParams),
			services.award.getAllOptions(reviewQueryParams),
			services.rup.getAllOptions(allQueryParams),
			services.award.getAllOptions(allQueryParams),
		],
	})

	const isLoading =
		reviewRupsQuery.isLoading || reviewAwardsQuery.isLoading || allRupsQuery.isLoading || allAwardsQuery.isLoading

	const reviewRups = reviewRupsQuery.data?.data ?? []
	const reviewAwards = reviewAwardsQuery.data?.data ?? []
	const allRups = allRupsQuery.data?.data ?? []
	const allAwards = allAwardsQuery.data?.data ?? []
	const reviewRupsCount = reviewRupsQuery.data?.meta.total ?? 0
	const reviewAwardsCount = reviewAwardsQuery.data?.meta.total ?? 0
	const totalRupsCount = allRupsQuery.data?.meta.total ?? 0
	const totalAwardsCount = allAwardsQuery.data?.meta.total ?? 0
	const totalCount = reviewRupsCount + reviewAwardsCount - (reviewRups.length + reviewAwards.length)

	const items = buildReviewItems(reviewRups, reviewAwards)
	const allItems = buildReviewItems(allRups, allAwards)
	const statusOrder: StatusEnum[] = [StatusEnum.IN_REVIEW, StatusEnum.APPROVED, StatusEnum.REJECTED, StatusEnum.DRAFT]
	const statusCounts = statusOrder.map((status) => ({
		status,
		count: allItems.filter((item) => item.status === status).length,
	}))
	const hasStatusData = statusCounts.some((item) => item.count > 0)

	if (isLoading) return <Loader type='data' />

	return (
		<div className='px-4 space-y-6 pt-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<section className='space-y-6'>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-2 '>
					<StatCard
						accent='warning'
						ctaLabel={t.viewAllLabel}
						description={t.rupsDescription}
						href='/rups/review?sort=desc&page=1'
						icon={FileText}
						reviewCount={reviewRupsCount}
						reviewLabel={t.reviewCountLabel}
						secondaryCount={totalRupsCount}
						secondaryLabel={t.totalCountLabel}
						title={t.rupsTitle}
					/>

					<StatCard
						accent='success'
						ctaLabel={t.viewAllLabel}
						description={t.kpiDescription}
						href='/kpi/all?status=IN_REVIEW&sort=desc&page=1'
						icon={CheckCircle}
						reviewCount={reviewAwardsCount}
						reviewLabel={t.reviewCountLabel}
						secondaryCount={totalAwardsCount}
						secondaryLabel={t.totalCountLabel}
						title={t.kpiTitle}
					/>
				</div>

				<CombineCard isLoading={isLoading} items={items} more={totalCount} title={t.reviewTitle} />
			</section>

			<section>
				<Card className='lg:col-span-4 min-w-0'>
					<CardHeader>
						<CardTitle className='lg:text-xl text-lg'>{t.statusOverviewTitle}</CardTitle>
						<CardDescription>
							{interpolateUILocaleText(t.statusOverviewDescription, { count: allItems.length })}
						</CardDescription>
					</CardHeader>
					<CardContent className='min-w-0 space-y-3'>
						{hasStatusData ? (
							<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
								{statusCounts.map((item) => (
									<div key={item.status} className='rounded-md border p-3'>
										<div className='mb-2'>
											<StatusBadge status={item.status} />
										</div>
										<p className='text-2xl font-semibold leading-none'>{item.count}</p>
									</div>
								))}
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>{t.statusOverviewEmpty}</p>
						)}
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
