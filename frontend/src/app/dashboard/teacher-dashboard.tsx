import type { FC } from 'react'

import Link from 'next/link'

import { CombineCard, PageTitle } from '@components'
import { buildReviewItems } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useQueries } from '@tanstack/react-query'
import { CheckCircle, Clock, FileText, Plus } from 'lucide-react'

interface IProps {
	keycloakId: string
}

export const TeacherDashboard: FC<IProps> = ({ keycloakId }) => {
	const queryParams = { currentPage: 1, pageSize: 10, teacher: keycloakId }

	// queries
	const [rupsQuery, awardsQuery] = useQueries({
		queries: [services.rup.getAllOptions(queryParams), services.award.getAllOptions(queryParams)],
	})

	const isLoading = rupsQuery.isLoading || awardsQuery.isLoading

	const rups = rupsQuery.data?.data ?? []
	const awards = awardsQuery.data?.data ?? []
	const totalCount =
		(rupsQuery?.data?.meta.total || 0) + (awardsQuery?.data?.meta.total || 0) - (rups.length + awards.length)

	const items = buildReviewItems(rups, awards)

	return (
		<section className='space-y-6 px-4 pt-6'>
			<PageTitle description='Обзор вашей текущей деятельности, задач и статусов документов.'>
				Панель управления преподавателя
			</PageTitle>

			{/* rup, kpi */}
			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<FileText className='h-5 w-5 text-primary' />
							Рабочие учебные программы
						</CardTitle>
						<CardDescription>
							Узнайте подробнее о процессе создания и проверки, а также просмотрите все РУП.
						</CardDescription>
					</CardHeader>
					<CardContent className='grid gap-4 sm:grid-cols-2'>
						<Button asChild className='w-full' variant='outline'>
							<Link href='/rups'>Все РУП</Link>
						</Button>
						<Button asChild className='w-full'>
							<Link href='/rups/create'>
								<Plus className='mr-2 h-4 w-4' />
								Создать РУП
							</Link>
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<CheckCircle className='h-5 w-5 text-primary' />
							Показатели эффективности (KPI)
						</CardTitle>
						<CardDescription>Узнайте подробнее о процессе создания и просмотрите все KPI.</CardDescription>
					</CardHeader>
					<CardContent className='grid gap-4 sm:grid-cols-2'>
						<Button asChild className='w-full' variant='outline'>
							<Link href='/kpi'>Все KPI</Link>
						</Button>
						<Button asChild className='w-full'>
							<Link href='/kpi/create/manual'>
								<Plus className='mr-2 h-4 w-4' />
								Создать KPI
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 md:grid-cols-4 grid-cols-1'>
				<CombineCard
					className='md:col-span-3'
					isLoading={isLoading}
					items={items}
					more={totalCount}
					title='Ожидают проверки'
				/>

				{/* Deadlines & Notifications */}
				<Card>
					<CardHeader>
						<CardTitle>Ваши последние действия</CardTitle>
					</CardHeader>
					<CardContent className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
						<Clock className='mb-4 opacity-50' size={40} strokeWidth={1.5} />
						<p className='text-sm font-medium'>Функция в разработке</p>
						<p className='text-xs opacity-70'>Скоро здесь появится история ваших событий</p>
					</CardContent>
				</Card>
			</div>
		</section>
	)
}
