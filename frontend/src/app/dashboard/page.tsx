import type { NextPage } from 'next'

import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Progress,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { AlertTriangle, Bell } from 'lucide-react'

// --- Mock Data ---
// В реальном приложении эти данные будут приходить с бэкенда

const documentsStatus = [
	{ name: 'Рабочая учебная программа (РУП)', status: 'completed', progress: 100 },
	{ name: 'Календарно-тематический план', status: 'in_progress', progress: 75 },
	{ name: 'Силлабус по дисциплине "Web-программирование"', status: 'in_progress', progress: 40 },
	{ name: 'Фонд оценочных средств', status: 'not_started', progress: 0 },
]

const deadlines = [
	{ name: 'Обновление силлабуса', dueDate: '2024-09-01', urgency: 'high' },
	{ name: 'Подача отчета по практике', dueDate: '2024-09-15', urgency: 'medium' },
	{ name: 'Загрузка материалов в СДО', dueDate: '2024-10-01', urgency: 'low' },
]

const notifications = [
	{
		id: 1,
		type: 'warning',
		message: 'Ваша запись о квалификации не подтверждена. Пожалуйста, загрузите подтверждающие документы.',
	},
	{ id: 2, type: 'info', message: 'Новый студент добавлен в группу "П-41".' },
	{ id: 3, type: 'warning', message: 'РУП "Информационные системы" требует вашего согласования.' },
]

// --- Helper Components & Mappings ---

const statusLabels: Record<string, string> = {
	completed: 'Завершено',
	in_progress: 'В процессе',
	not_started: 'Не начато',
}

const urgencyLabels: Record<string, string> = {
	high: 'Высокая срочность',
	medium: 'Средняя срочность',
	low: 'Низкая срочность',
}

const notificationIcons: Record<string, React.ReactNode> = {
	warning: <AlertTriangle className='h-5 w-5 text-amber-500' />,
	info: <Bell className='h-5 w-5 text-blue-500' />,
}

// --- Page Component ---

const TeacherDashboardPage: NextPage = () => {
	return (
		<div className='p-4 sm:p-6 lg:p-8 space-y-6'>
			<div className='space-y-1'>
				<h1 className='text-2xl font-bold tracking-tight'>Дашборд преподавателя</h1>
				<p className='text-muted-foreground'>Обзор вашей текущей деятельности и задач.</p>
			</div>

			<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
				{/* Карта статуса документов */}
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>Статус заполнения обязательных документов</CardTitle>
						<CardDescription>Отслеживайте прогресс по вашим ключевым документам.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{documentsStatus.map((doc) => (
								<div key={doc.name}>
									<div className='flex justify-between items-center mb-1'>
										<span className='text-sm font-medium'>{doc.name}</span>
										<span className='text-xs text-muted-foreground'>{statusLabels[doc.status]}</span>
									</div>
									<Progress value={doc.progress} />
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Карта уведомлений */}
				<Card>
					<CardHeader>
						<CardTitle>Уведомления</CardTitle>
						<CardDescription>Важные оповещения и требующие внимания записи.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{notifications.map((notification) => (
								<div key={notification.id} className='flex items-start gap-3'>
									<div className='shrink-0'>{notificationIcons[notification.type]}</div>
									<p className='text-sm text-muted-foreground'>{notification.message}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Карта сроков */}
				<Card className='lg:col-span-3'>
					<CardHeader>
						<CardTitle>Сроки подачи и обновления документов</CardTitle>
						<CardDescription>Предстоящие дедлайны, которые нельзя пропустить.</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Документ</TableHead>
									<TableHead>Срок</TableHead>
									<TableHead className='text-right'>Срочность</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{deadlines.map((deadline) => (
									<TableRow key={deadline.name}>
										<TableCell className='font-medium'>{deadline.name}</TableCell>
										<TableCell>{new Date(deadline.dueDate).toLocaleDateString('ru-RU')}</TableCell>
										<TableCell className='text-right'>
											<Badge
												className='capitalize'
												variant={deadline.urgency === 'high' ? 'destructive' : 'secondary'}
											>
												{urgencyLabels[deadline.urgency]}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default TeacherDashboardPage
