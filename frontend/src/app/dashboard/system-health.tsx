import { Badge, Card, CardContent, CardHeader, CardTitle } from '@ui'
import { AlertTriangle, CheckCircle, Database, Server, Wifi, XCircle, Zap } from 'lucide-react'

interface SystemMetric {
	name: string
	status: 'healthy' | 'warning' | 'error'
	value: string
	icon: React.ComponentType<{ className?: string }>
	description: string
}

const mockSystemMetrics: SystemMetric[] = [
	{
		name: 'Сервер',
		status: 'healthy',
		value: '99.9%',
		icon: Server,
		description: 'Время работы системы',
	},
	{
		name: 'База данных',
		status: 'healthy',
		value: '2.1ms',
		icon: Database,
		description: 'Среднее время отклика',
	},
	{
		name: 'Память',
		status: 'warning',
		value: '78%',
		icon: Zap,
		description: 'Использование памяти',
	},
	{
		name: 'Сеть',
		status: 'healthy',
		value: '45ms',
		icon: Wifi,
		description: 'Задержка сети',
	},
]

const getStatusIcon = (status: SystemMetric['status']) => {
	switch (status) {
		case 'healthy':
			return <CheckCircle className='h-5 w-5 text-green-500' />
		case 'warning':
			return <AlertTriangle className='h-5 w-5 text-yellow-500' />
		case 'error':
			return <XCircle className='h-5 w-5 text-red-500' />
	}
}

const getStatusBadge = (status: SystemMetric['status']) => {
	const variants = {
		healthy: 'default',
		warning: 'secondary',
		error: 'destructive',
	} as const

	const labels = {
		healthy: 'Здоров',
		warning: 'Предупреждение',
		error: 'Ошибка',
	}

	return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

const getStatusColor = (status: SystemMetric['status']) => {
	switch (status) {
		case 'healthy':
			return 'text-green-600'
		case 'warning':
			return 'text-yellow-600'
		case 'error':
			return 'text-red-600'
	}
}

export const SystemHealth = () => {
	const overallHealth = mockSystemMetrics.every((metric) => metric.status === 'healthy')
		? 'healthy'
		: mockSystemMetrics.some((metric) => metric.status === 'error')
			? 'error'
			: 'warning'

	const healthyCount = mockSystemMetrics.filter((m) => m.status === 'healthy').length
	const totalCount = mockSystemMetrics.length

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center justify-between'>
					<span>Здоровье системы</span>
					<div className='flex items-center space-x-2'>
						{getStatusIcon(overallHealth)}
						<span className='text-sm text-muted-foreground'>
							{healthyCount}/{totalCount} систем здоровы
						</span>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid gap-4 md:grid-cols-2'>
					{mockSystemMetrics.map((metric, index) => {
						const Icon = metric.icon

						return (
							<div key={index} className='flex flex-col justify-center p-4 border rounded-lg'>
								<div className='flex items-center space-x-3'>
									<div
										className={`p-2 rounded-lg ${
											metric.status === 'healthy'
												? 'bg-green-100 dark:bg-green-900'
												: metric.status === 'warning'
													? 'bg-yellow-100 dark:bg-yellow-900'
													: 'bg-red-100 dark:bg-red-900'
										}`}
									>
										<Icon
											className={`h-5 w-5 ${
												metric.status === 'healthy'
													? 'text-green-500'
													: metric.status === 'warning'
														? 'text-yellow-500'
														: 'text-red-500'
											}`}
										/>
									</div>

									<div>
										<h3 className='font-medium'>{metric.name}</h3>
										<p className='text-sm text-muted-foreground'>{metric.description}</p>
									</div>
								</div>
								<div className='flex items-center justify-between mt-1'>
									<div className={`text-lg font-bold ${getStatusColor(metric.status)}`}>{metric.value}</div>
									<p>{getStatusBadge(metric.status)}</p>
								</div>
							</div>
						)
					})}
				</div>

				{/* System Summary */}
				<div className='mt-6 p-4 bg-accent rounded-lg'>
					<div className='flex items-center justify-between'>
						<div>
							<h4 className='font-medium'>Общее состояние</h4>
							<p className='text-sm text-muted-foreground mt-1'>
								Все основные системы работают нормально. Мониторинг активен 24/7.
							</p>
						</div>
						<div className='text-right'>
							<div className='text-2xl font-bold text-primary'>
								{Math.round((healthyCount / totalCount) * 100)}%
							</div>
							<div className='text-sm text-muted-foreground'>доступность</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
