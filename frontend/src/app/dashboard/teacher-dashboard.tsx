'use client'

import type { FC } from 'react'

import Link from 'next/link'

import { CombineCard, PageTitle, PenaltyCard, ViolationBadge } from '@components'
import { buildReviewItems, getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQueries } from '@tanstack/react-query'
import { CheckCircle, FileText, Plus } from 'lucide-react'

import localeDictionary from './locale.json'

interface IProps {
	keycloakId: string
}

export const TeacherDashboard: FC<IProps> = ({ keycloakId }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).teacher
	const queryParams = { currentPage: 1, pageSize: 10, teacher: keycloakId, sort: 'desc' as const }

	// queries
	const [rupsQuery, awardsQuery, userQuery, penaltiesQuery] = useQueries({
		queries: [
			services.rup.getAllOptions(queryParams),
			services.award.getAllOptions(queryParams),
			{ ...services.user.getByIdOptions(keycloakId), enabled: !!keycloakId },
			{
				...services.user.getAllPenaltiesByTeacherIdOptions(keycloakId, { sort: 'desc' }),
				enabled: !!keycloakId,
			},
		],
	})

	const isLoading = rupsQuery.isLoading || awardsQuery.isLoading
	const isPenaltiesLoading = userQuery.isLoading || penaltiesQuery.isLoading

	const rups = rupsQuery.data?.data ?? []
	const awards = awardsQuery.data?.data ?? []
	const user = userQuery.data
	const penalties = penaltiesQuery.data ?? []
	const totalCount =
		(rupsQuery?.data?.meta.total || 0) + (awardsQuery?.data?.meta.total || 0) - (rups.length + awards.length)

	const items = buildReviewItems(rups, awards)

	return (
		<section className='space-y-6 px-4 pt-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			{/* rup, kpi */}
			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<FileText className='h-5 w-5 text-primary' />
							{t.rupsTitle}
						</CardTitle>
						<CardDescription>{t.rupsDescription}</CardDescription>
					</CardHeader>
					<CardContent className='grid gap-4 sm:grid-cols-2'>
						<Button asChild className='w-full' variant='outline'>
							<Link href='/rups'>{t.allRups}</Link>
						</Button>
						<Button asChild className='w-full'>
							<Link href='/rups/create'>
								<Plus className='mr-2 h-4 w-4' />
								{t.createRup}
							</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<CheckCircle className='h-5 w-5 text-primary' />
							{t.kpiTitle}
						</CardTitle>
						<CardDescription>{t.kpiDescription}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className='w-full' variant='secondary'>
							<Link href='/kpi/entry'>{t.allKpi}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className='grid grid-cols-1 gap-6 md:min-h-[calc(100svh-19rem)] md:grid-cols-3'>
				<CombineCard
					className='md:col-span-2'
					isLoading={isLoading}
					items={items}
					more={totalCount}
					title={t.reviewTitle}
				/>

				<div className='md:col-span-1 flex h-full min-h-0 flex-col gap-4'>
					{user && <ViolationBadge showSeparator={false} user={user} />}
					<PenaltyCard className='min-h-0 flex-1' isLoading={isPenaltiesLoading} penalties={penalties} />
				</div>
			</div>
		</section>
	)
}
