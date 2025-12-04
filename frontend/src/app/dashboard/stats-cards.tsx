import { Card, CardContent, CardHeader, CardTitle } from '@ui'
import { BookOpen, Clock, Download, FileText, TrendingUp, Users } from 'lucide-react'

interface StatCardProps {
	title: string
	value: string | number
	description: string
	icon: React.ComponentType<{ className?: string }>
	trend?: {
		value: number
		label: string
	}
}

const StatCard = ({ title, value, description, icon: Icon, trend }: StatCardProps) => (
	<Card>
		<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
			<CardTitle className='text-sm font-medium'>{title}</CardTitle>
			<Icon className='h-4 w-4 text-muted-foreground' />
		</CardHeader>
		<CardContent>
			<div className='text-2xl font-bold'>{value}</div>
			<p className='text-xs text-muted-foreground'>{description}</p>
			{trend && (
				<div className='flex items-center pt-1'>
					<TrendingUp className='h-3 w-3 text-green-500 mr-1' />
					<span className='text-xs text-green-500'>
						+{trend.value}% {trend.label}
					</span>
				</div>
			)}
		</CardContent>
	</Card>
)

export const StatsCards = () => {
	const stats = [
		{
			title: 'Всего РУП',
			value: 24,
			description: 'Активных учебных планов',
			icon: FileText,
			trend: { value: 12, label: 'от прошлого месяца' },
		},
		{
			title: 'Дисциплин',
			value: 156,
			description: 'Уникальных предметов',
			icon: BookOpen,
			trend: { value: 8, label: 'от прошлого месяца' },
		},
		{
			title: 'Экспортов',
			value: 89,
			description: 'Создано отчетов',
			icon: Download,
			trend: { value: 23, label: 'от прошлой недели' },
		},
		{
			title: 'Пользователей',
			value: 12,
			description: 'Активных пользователей',
			icon: Users,
		},
		{
			title: 'В обработке',
			value: 3,
			description: 'Текущих экспортов',
			icon: Clock,
		},
		{
			title: 'Завершено',
			value: 86,
			description: 'Успешных экспортов',
			icon: TrendingUp,
			trend: { value: 95, label: 'успешность' },
		},
	]

	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
			{stats.map((stat, index) => (
				<StatCard key={index} {...stat} />
			))}
		</div>
	)
}
