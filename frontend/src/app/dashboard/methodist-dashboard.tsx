import { useMemo } from 'react'

import dynamic from 'next/dynamic'

import { CombineCard, Loader, PageTitle } from '@components'
import { buildReviewItems, getUILocaleSection, isCurrentDay } from '@helpers'
import { services } from '@services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQueries } from '@tanstack/react-query'
import { StatusEnum } from '@types'
import { CheckCircle, FileText } from 'lucide-react'

import localeDictionary from './locale.json'
import { StatCard } from './stat-card'

const StatusChart = dynamic(() => import('./status-chart'), {
	ssr: false,
	loading: () => <div className='h-96 w-full bg-muted animate-pulse rounded-lg' />,
})

const queryParams = { currentPage: 1, pageSize: 10, status: [StatusEnum.IN_REVIEW] }

export const MethodistDashboard = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).methodist
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const [rupsQuery, awardsQuery] = useQueries({
		queries: [services.rup.getAllOptions(queryParams), services.award.getAllOptions(queryParams)],
	})

	const isLoading = rupsQuery.isLoading || awardsQuery.isLoading

	const rups = rupsQuery.data?.data ?? []
	const awards = awardsQuery.data?.data ?? []
	const totalCount =
		(rupsQuery?.data?.meta.total || 0) + (awardsQuery?.data?.meta.total || 0) - (rups.length + awards.length)

	const reviewRups = rups.filter((r) => r.status === StatusEnum.IN_REVIEW) || []
	const reviewRupsCount = reviewRups?.length || 0
	const approvedRupsCount =
		rups.filter((r) => r.status === StatusEnum.APPROVED && isCurrentDay(r.updatedAt)).length || 0

	const reviewAwards = awards.filter((a) => a.status === StatusEnum.IN_REVIEW) || []
	const reviewAwardsCount = reviewAwards?.length || 0
	const approvedAwardsCount =
		awards.filter((a) => a.status === StatusEnum.APPROVED && isCurrentDay(a.updatedAt)).length || 0

	// combine two two data
	const items = buildReviewItems(rups, awards)

	const chartData = useMemo(() => {
		const today = new Date()
		const data = items || []

		return Array.from({ length: 7 }).map((_, i) => {
			const date = new Date(today)

			date.setDate(today.getDate() - (6 - i))

			const dayRups = data.filter((r) => {
				const rDate = new Date(r.updatedAt)

				return (
					rDate.getDate() === date.getDate() &&
					rDate.getMonth() === date.getMonth() &&
					rDate.getFullYear() === date.getFullYear()
				)
			})

			return {
				date: date.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' }),
				approved: dayRups.filter((r) => r.status === StatusEnum.APPROVED).length,
				review: dayRups.filter((r) => r.status === StatusEnum.IN_REVIEW).length,
				rejected: dayRups.filter((r) => r.status === StatusEnum.REJECTED).length,
				in_progress: dayRups.filter((r) => r.status === StatusEnum.DRAFT).length,
			}
		})
	}, [rupsQuery, awardsQuery])

	if (isLoading) return <Loader type='data' />

	return (
		<div className='px-4 space-y-6 pt-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<section className='space-y-6'>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-2 '>
					<StatCard
						accent='warning'
						approvedCount={approvedRupsCount}
						description={t.rupsDescription}
						href='/rups/review'
						icon={FileText}
						reviewCount={reviewRupsCount}
						title={t.rupsTitle}
					/>

					<StatCard
						accent='success'
						approvedCount={approvedAwardsCount}
						description={t.kpiDescription}
						href='/kpi/review'
						icon={CheckCircle}
						reviewCount={reviewAwardsCount}
						title={t.kpiTitle}
					/>
				</div>

				<CombineCard isLoading={isLoading} items={items} more={totalCount} title={t.reviewTitle} />
			</section>

			<section>
				<Card className='lg:col-span-4 min-w-0'>
					<CardHeader>
						<CardTitle className='lg:text-xl text-lg'>{t.chartTitle}</CardTitle>
						<CardDescription>{t.chartDescription}</CardDescription>
					</CardHeader>
					<CardContent className='min-w-0'>
						<StatusChart data={chartData} />
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
