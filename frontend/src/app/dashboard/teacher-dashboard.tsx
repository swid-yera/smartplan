import Link from 'next/link'

import { AwardsCard, PageTitle, RupsCard } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { CheckCircle, Clock, FileText, Plus } from 'lucide-react'

export const TeacherDashboard = () => {
	const { user } = useAuthStore()
	// queries
	const { data: rupData, isLoading: rupLoading } = useQuery({
		...services.rup.getAllOptions({ currentPage: 1, pageSize: 999, teacher: user?.keycloakId }),
	})
	const { data: awardData, isLoading: awardLoading } = useQuery({
		...services.award.getAllOptions({ currentPage: 1, pageSize: 999, teacher: user?.keycloakId }),
	})

	return (
		<div className='space-y-6'>
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
				<RupsCard
					className='col-span-3'
					currentPage={1}
					isLoading={rupLoading}
					rups={rupData?.data || []}
					title='Ваши рабочие учебные программы'
					totalPages={1}
					onPageChange={() => false}
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

			<AwardsCard
				awards={awardData?.data || []}
				currentPage={1}
				isLoading={awardLoading}
				title='Ваши документы KPI'
				totalPages={1}
				onPageChange={() => false}
			/>
		</div>
	)
}
