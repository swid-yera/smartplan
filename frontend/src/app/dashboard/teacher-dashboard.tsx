import { useState } from 'react'

import Link from 'next/link'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress } from '@ui'
import { AlertTriangle, CheckCircle, Clock, FileText, Plus, XCircle } from 'lucide-react'

export const TeacherDashboard = () => {
	const [filter, setFilter] = useState('all')

	const filteredDocuments = teacherDocuments.filter((doc) => filter === 'all' || doc.status === filter)

	return (
		<div className='space-y-6'>
			<div className='space-y-1'>
				<h1 className='text-2xl font-bold tracking-tight'>Дашборд преподавателя</h1>
				<p className='text-muted-foreground'>Обзор вашей текущей деятельности, задач и статусов документов.</p>
			</div>

			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<FileText className='h-5 w-5 text-primary' />
							Рабочие учебные планы
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
							<Link href='/kpi/create'>
								<Plus className='mr-2 h-4 w-4' />
								Создать KPI
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
				{/* Documents Status */}
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>Мои документы и KPI</CardTitle>
						<CardDescription>
							Статусы проверки ваших рабочих программ и показателей эффективности.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='flex flex-wrap gap-2 mb-6'>
							<Button
								size='sm'
								variant={filter === 'all' ? 'default' : 'outline'}
								onClick={() => setFilter('all')}
							>
								Все
							</Button>
							<Button
								size='sm'
								variant={filter === 'rejected' ? 'default' : 'outline'}
								onClick={() => setFilter('rejected')}
							>
								Отклонено
							</Button>
							<Button
								size='sm'
								variant={filter === 'in_progress' ? 'default' : 'outline'}
								onClick={() => setFilter('in_progress')}
							>
								В процессе
							</Button>
							<Button
								size='sm'
								variant={filter === 'completed' ? 'default' : 'outline'}
								onClick={() => setFilter('completed')}
							>
								Завершено
							</Button>
						</div>
						<div className='space-y-6'>
							{filteredDocuments.map((doc) => {
								const config = statusConfig[doc.status] || statusConfig.not_started

								return (
									<div key={doc.id} className='space-y-2'>
										<div className='flex items-start justify-between'>
											<div className='space-y-1'>
												<div className='font-medium flex items-center gap-2'>
													{doc.name}
													<span className={`flex items-center gap-1 text-xs ${config.color}`}>
														{config.icon}
														{config.label}
													</span>
												</div>
												{doc.status === 'rejected' && doc.reason && (
													<div className='text-sm text-destructive bg-destructive/10 p-2 rounded-md flex items-start gap-2'>
														<AlertTriangle className='h-4 w-4 shrink-0 mt-0.5' />
														<span>Причина отказа: {doc.reason}</span>
													</div>
												)}
											</div>
											{doc.status === 'rejected' || doc.status === 'in_progress' ? (
												<Button
													asChild
													size='sm'
													variant={doc.status === 'rejected' ? 'default' : 'outline'}
												>
													<Link href={doc.link}>
														{doc.status === 'rejected' ? 'Исправить' : 'Редактировать'}
													</Link>
												</Button>
											) : null}
										</div>
										<Progress
											className={doc.status === 'rejected' ? 'bg-destructive/20' : ''}
											value={doc.progress}
										/>
									</div>
								)
							})}
						</div>
					</CardContent>
				</Card>

				{/* Deadlines & Notifications */}
				<Card>
					<CardHeader>
						<CardTitle>Ваши последние действия</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{teacherRecentActions.map((action, i) => (
								<Link
									key={i}
									className='flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:underline'
									href={action.link}
								>
									<div className='space-y-1'>
										<p className='text-sm font-medium leading-none'>{action.action}</p>
										<p className='text-xs text-muted-foreground'>{action.target}</p>
									</div>
									<div className='text-xs text-muted-foreground'>{action.date}</div>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

// helpers & mappers

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
	completed: { label: 'Завершено', icon: <CheckCircle className='h-4 w-4' />, color: 'text-green-500' },
	in_progress: { label: 'В процессе', icon: <Clock className='h-4 w-4' />, color: 'text-blue-500' },
	rejected: { label: 'Отклонено', icon: <XCircle className='h-4 w-4' />, color: 'text-red-500' },
	not_started: { label: 'Не начато', icon: <FileText className='h-4 w-4' />, color: 'text-gray-400' },
}

// mock data
const teacherDocuments = [
	{
		id: 1,
		name: 'Рабочая учебная программа (РУП)',
		status: 'rejected',
		progress: 100,
		reason: 'Некорректное распределение часов по темам.',
		link: '/rups/edit/1',
	},
	{
		id: 2,
		name: 'KPI: Научная работа',
		status: 'rejected',
		progress: 100,
		reason: 'Отсутствует подтверждение публикации статьи.',
		link: '/kpi/edit/2',
	},
	{
		id: 3,
		name: 'Календарно-тематический план',
		status: 'in_progress',
		progress: 75,
		link: '/ktp/edit/3',
	},
	{
		id: 4,
		name: 'Силлабус',
		status: 'completed',
		progress: 100,
		link: '/syllabus/view/4',
	},
]

const teacherRecentActions = [
	{ action: 'Загрузка РУП', target: 'Web-программирование', date: 'Сегодня, 10:30', link: '/rups/1' },
	{ action: 'Редактирование KPI', target: 'Научная работа', date: 'Вчера, 14:15', link: '/kpi/2' },
	{ action: 'Обновление профиля', target: 'Личные данные', date: '20.08.2024', link: '/profile' },
]
