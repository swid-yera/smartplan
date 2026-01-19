import { useMemo } from 'react'

import dynamic from 'next/dynamic'
import Link from 'next/link'

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { Activity, CheckCircle, FileText } from 'lucide-react'

const StatusChart = dynamic(() => import('./status-chart'), {
	ssr: false,
	loading: () => <div className='h-96 w-full bg-muted animate-pulse rounded-lg' />,
})

export const MethodistDashboard = () => {
	const chartData = useMemo(() => {
		const today = new Date()

		return Array.from({ length: 7 }).map((_, i) => {
			const date = new Date(today)

			date.setDate(today.getDate() - (6 - i))

			return {
				date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
				approved: Math.floor(Math.random() * 20) + 20,
				review: Math.floor(Math.random() * 10) + 5,
				rejected: Math.floor(Math.random() * 5),
				in_progress: Math.floor(Math.random() * 10) + 5,
			}
		})
	}, [])

	return (
		<div className='space-y-6'>
			<div className='space-y-1'>
				<h1 className='text-2xl font-bold tracking-tight'>Дашборд методиста</h1>
				<p className='text-muted-foreground'>Управление проверками РУП и KPI преподавателей.</p>
			</div>

			<div className='grid gap-6 md:grid-cols-2'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>РУП</CardTitle>
						<FileText className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='flex items-center justify-between'>
							<div>
								<div className='text-2xl font-bold'>12</div>
								<p className='text-xs text-muted-foreground'>Ожидают проверки</p>
							</div>
							<div className='text-right'>
								<div className='text-2xl font-bold'>8</div>
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
								<div className='text-2xl font-bold'>5</div>
								<p className='text-xs text-muted-foreground'>Ожидают проверки</p>
							</div>
							<div className='text-right'>
								<div className='text-2xl font-bold'>2</div>
								<p className='text-xs text-muted-foreground'>За сегодня проверено</p>
							</div>
						</div>
						<Button asChild className='mt-4 w-full' variant='outline'>
							<Link href='/kpi'>Посмотреть все KPI</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card className='w-full'>
				<CardHeader>
					<CardTitle>Ожидают проверки</CardTitle>
					<CardDescription>Документы и показатели, отправленные преподавателями на согласование.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Преподаватель</TableHead>
								<TableHead>Тип</TableHead>
								<TableHead>Предмет / Категория</TableHead>
								<TableHead>Дата подачи</TableHead>
								<TableHead className='text-right'>Действие</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pendingReviews.map((review) => (
								<TableRow key={review.id}>
									<TableCell className='font-medium'>{review.teacher}</TableCell>
									<TableCell>
										<Badge variant='outline'>{review.type}</Badge>
									</TableCell>
									<TableCell>{review.subject || review.category}</TableCell>
									<TableCell>{new Date(review.date).toLocaleDateString('ru-RU')}</TableCell>
									<TableCell className='text-right'>
										<Button asChild size='sm'>
											<Link href={review.link}>Проверить</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<div className='grid gap-6 lg:grid-cols-7'>
				<Card className='lg:col-span-4 min-w-0'>
					<CardHeader>
						<CardTitle>Динамика статусов документов</CardTitle>
						<CardDescription>Изменение количества документов по статусам за последние 7 дней</CardDescription>
					</CardHeader>
					<CardContent className='min-w-0'>
						<StatusChart data={chartData} />
					</CardContent>
				</Card>

				<Card className='lg:col-span-3'>
					<CardHeader>
						<CardTitle>Последние события</CardTitle>
						<CardDescription>Лента активности пользователей</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{recentEvents.map((event) => (
								<Link
									key={event.id}
									className='flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0 hover:underline'
									href={`/rup/${event.id}`}
								>
									<div className='mt-1 bg-primary/10 p-2 rounded-full'>
										<Activity className='h-4 w-4 text-primary' />
									</div>
									<div className='space-y-1'>
										<p className='text-sm font-medium leading-none'>{event.user}</p>
										<p className='text-xs text-muted-foreground'>
											{event.action}: <span className='font-medium text-foreground'>{event.target}</span>
										</p>
										<p className='text-xs text-muted-foreground pt-1'>{event.date}</p>
									</div>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

// mock data
const pendingReviews = [
	{
		id: 1,
		teacher: 'Иванов И.И.',
		type: 'РУП',
		subject: 'Web-программирование',
		date: '2024-08-25',
		link: '/rups/review/1',
	},
	{
		id: 2,
		teacher: 'Петрова А.С.',
		type: 'KPI',
		category: 'Методическая работа',
		date: '2024-08-26',
		link: '/kpi/review/2',
	},
	{
		id: 3,
		teacher: 'Сидоров В.К.',
		type: 'РУП',
		subject: 'Базы данных',
		date: '2024-08-27',
		link: '/rups/review/3',
	},
	{
		id: 4,
		teacher: 'Алексеева О.Н.',
		type: 'KPI',
		category: 'Научная работа',
		date: '2024-08-28',
		link: '/kpi/review/4',
	},
]

const recentEvents = [
	{
		id: 1,
		user: 'Иванов И.И.',
		action: 'Загрузил РУП',
		target: 'Web-программирование',
		date: '10 минут назад',
	},
	{
		id: 2,
		user: 'Петрова А.С.',
		action: 'Обновила KPI',
		target: 'Публикация статьи',
		date: '1 час назад',
	},
	{
		id: 3,
		user: 'Сидоров В.К.',
		action: 'Отправил на проверку',
		target: 'Базы данных',
		date: '3 часа назад',
	},
	{
		id: 4,
		user: 'Алексеева О.Н.',
		action: 'Исправила замечания',
		target: 'Научная работа',
		date: '5 часов назад',
	},
	{
		id: 5,
		user: 'Иванов И.И.',
		action: 'Обновил профиль',
		target: 'Личные данные',
		date: 'Вчера',
	},
]
