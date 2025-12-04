import { Badge, Card, CardContent, CardHeader, CardTitle } from '@ui'
import { Clock, Download, Edit, FileText, Upload } from 'lucide-react'

export const RecentActivities = () => {
	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
		const diffDays = Math.floor(diffHours / 24)

		if (diffHours < 1) return 'только что'
		if (diffHours < 24) return `${diffHours} ч назад`
		if (diffDays === 1) return 'вчера'
		if (diffDays < 7) return `${diffDays} д назад`

		return date.toLocaleDateString('ru-RU')
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Недавняя активность</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					{mockActivities.map((activity) => {
						const Icon = getActivityIcon(activity.type)
						const iconColor = getActivityColor(activity.type)

						return (
							<div key={activity.id} className='flex items-start space-x-3'>
								<div className={`p-2 rounded-full bg-accent ${iconColor}`}>
									<Icon className='h-4 w-4' />
								</div>
								<div className='flex-1 min-w-0'>
									<div className='flex items-center justify-between'>
										<p className='text-sm font-medium'>{activity.title}</p>
										{getStatusBadge(activity.status)}
									</div>
									<p className='text-sm text-muted-foreground mt-1'>{activity.description}</p>
									<div className='flex items-center justify-between mt-2'>
										<span className='text-xs text-foreground'>{activity.user}</span>
										<span className='text-xs text-muted-foreground'>{formatTime(activity.timestamp)}</span>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}

interface Activity {
	id: string
	type: 'create' | 'edit' | 'export' | 'import'
	title: string
	description: string
	timestamp: string
	user: string
	status?: 'success' | 'pending' | 'error'
}

const mockActivities: Activity[] = [
	{
		id: '1',
		type: 'export',
		title: 'Экспорт РУП',
		description: 'РУП Информатика 2025-2026 экспортирован в PDF',
		timestamp: '2025-12-04T10:30:00Z',
		user: 'Иванов И.И.',
		status: 'success',
	},
	{
		id: '2',
		type: 'edit',
		title: 'Редактирование РУП',
		description: 'Обновлена дисциплина "Программирование"',
		timestamp: '2025-12-04T09:15:00Z',
		user: 'Петрова А.С.',
		status: 'success',
	},
	{
		id: '3',
		type: 'create',
		title: 'Создание РУП',
		description: 'Создан новый РУП "Математика 2025-2026"',
		timestamp: '2025-12-04T08:45:00Z',
		user: 'Сидоров П.П.',
		status: 'success',
	},
	{
		id: '4',
		type: 'import',
		title: 'Импорт документа',
		description: 'ИИ обработал документ РУП Физика',
		timestamp: '2025-12-04T08:00:00Z',
		user: 'Система',
		status: 'success',
	},
	{
		id: '5',
		type: 'export',
		title: 'Экспорт РУП',
		description: 'РУП Химия 2025-2026 - обработка',
		timestamp: '2025-12-04T07:30:00Z',
		user: 'Кузнецова М.В.',
		status: 'pending',
	},
]

const getActivityIcon = (type: Activity['type']) => {
	switch (type) {
		case 'create':
			return FileText
		case 'edit':
			return Edit
		case 'export':
			return Download
		case 'import':
			return Upload
		default:
			return Clock
	}
}

const getActivityColor = (type: Activity['type']) => {
	switch (type) {
		case 'create':
			return 'text-green-600'
		case 'edit':
			return 'text-blue-600'
		case 'export':
			return 'text-purple-600'
		case 'import':
			return 'text-orange-600'
		default:
			return 'text-gray-600'
	}
}

const getStatusBadge = (status?: Activity['status']) => {
	if (!status) return null

	const variants = {
		success: 'default',
		pending: 'secondary',
		error: 'destructive',
	} as const

	const labels = {
		success: 'Успешно',
		pending: 'В процессе',
		error: 'Ошибка',
	}

	return (
		<Badge className='text-xs' variant={variants[status]}>
			{labels[status]}
		</Badge>
	)
}
