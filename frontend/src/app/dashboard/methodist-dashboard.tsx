import { useMemo } from 'react'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import { AwardsCard, PageTitle, RupsCard } from '@components'
import { isCurrentDay } from '@helpers'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { StatusEnum } from '@types'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { CheckCircle, FileText } from 'lucide-react'

const StatusChart = dynamic(() => import('./status-chart'), {
	ssr: false,
	loading: () => <div className='h-96 w-full bg-muted animate-pulse rounded-lg' />,
})

export const MethodistDashboard = () => {
	const { data: rupData, isLoading: rupLoading } = useQuery({
		...services.rup.getAllOptions({ currentPage: 1, pageSize: 999 }),
	})
	const { data: awardData, isLoading: awardLoading } = useQuery({
		...services.award.getAllOptions({ currentPage: 1, pageSize: 999 }),
	})

	const rups = rupData?.data || []
	const awards = awardData?.data || []

	const reviewRups = rups.filter((r) => r.status === StatusEnum.IN_REVIEW) || []
	const reviewRupsCount = reviewRups?.length || 0
	const approvedRupsCount =
		rups.filter((r) => r.status === StatusEnum.APPROVED && isCurrentDay(r.updatedAt)).length || 0

	const reviewAwards = awards.filter((a) => a.status === StatusEnum.IN_REVIEW) || []
	const reviewAwardsCount = reviewAwards?.length || 0
	const approvedAwardsCount =
		awards.filter((a) => a.status === StatusEnum.APPROVED && isCurrentDay(a.updatedAt)).length || 0

	const chartData = useMemo(() => {
		const today = new Date()
		const data = rups || []

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
				date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
				approved: dayRups.filter((r) => r.status === StatusEnum.APPROVED).length,
				review: dayRups.filter((r) => r.status === StatusEnum.IN_REVIEW).length,
				rejected: dayRups.filter((r) => r.status === StatusEnum.REJECTED).length,
				in_progress: dayRups.filter((r) => r.status === StatusEnum.DRAFT).length,
			}
		})
	}, [rupData])

	return (
		<div className='space-y-6'>
			<PageTitle description='Управление проверками РУП и KPI преподавателей.'>Дашборд методиста</PageTitle>

			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>РУП</CardTitle>
						<FileText className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='flex items-center justify-between'>
							<div>
								<div className='text-2xl font-bold'>{reviewRupsCount}</div>
								<p className='text-xs text-muted-foreground'>Ожидают проверки</p>
							</div>
							<div className='text-right'>
								<div className='text-2xl font-bold'>{approvedRupsCount}</div>
								<p className='text-xs text-muted-foreground'>За сегодня проверено</p>
							</div>
						</div>
						<Button asChild className='mt-4 w-full' variant='outline'>
							<Link href='/rups'>Посмотреть все РУП</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>KPI</CardTitle>
						<CheckCircle className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='flex items-center justify-between'>
							<div>
								<div className='text-2xl font-bold'>{reviewAwardsCount}</div>
								<p className='text-xs text-muted-foreground'>Ожидают проверки</p>
							</div>
							<div className='text-right'>
								<div className='text-2xl font-bold'>{approvedAwardsCount}</div>
								<p className='text-xs text-muted-foreground'>За сегодня проверено</p>
							</div>
						</div>
						<Button asChild className='mt-4 w-full' variant='outline'>
							<Link href='/kpi'>Посмотреть все KPI</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<RupsCard
				currentPage={1}
				description='Ожидают проверки'
				isLoading={rupLoading}
				rups={reviewRups}
				title='Рабочие учебные планы'
				totalPages={1}
				onPageChange={() => false}
			/>

			<AwardsCard
				awards={reviewAwards}
				currentPage={1}
				description='Ожидают проверки'
				isLoading={awardLoading}
				title='KPI'
				totalPages={1}
				onPageChange={() => false}
			/>

			<Card className='lg:col-span-4 min-w-0'>
				<CardHeader>
					<CardTitle>Динамика статусов Рабочих учебных планов</CardTitle>
					<CardDescription>
						Изменение количества рабочих учебных планов по статусам за последние 7 дней
					</CardDescription>
				</CardHeader>
				<CardContent className='min-w-0'>
					<StatusChart data={chartData} />
				</CardContent>
			</Card>
		</div>
	)
}
