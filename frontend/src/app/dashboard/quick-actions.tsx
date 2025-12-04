import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@ui'
import { BarChart3, Download, FileText, Plus, Settings, Upload } from 'lucide-react'

interface QuickAction {
	title: string
	description: string
	icon: React.ComponentType<{ className?: string }>
	href: string
	color: string
}

const quickActions: QuickAction[] = [
	{
		title: 'Создать РУП',
		description: 'Создать новый учебный план',
		icon: Plus,
		href: '/rup/new',
		color: 'bg-blue-500 hover:bg-blue-600',
	},
	{
		title: 'Импорт РУП',
		description: 'Загрузить документ с ИИ анализом',
		icon: Upload,
		href: '/ai/import',
		color: 'bg-green-500 hover:bg-green-600',
	},
	{
		title: 'Экспорт отчетов',
		description: 'Создать и скачать отчеты',
		icon: Download,
		href: '/exports',
		color: 'bg-purple-500 hover:bg-purple-600',
	},
	{
		title: 'Просмотр РУП',
		description: 'Открыть существующий план',
		icon: FileText,
		href: '/rup/123',
		color: 'bg-orange-500 hover:bg-orange-600',
	},
	{
		title: 'Аналитика',
		description: 'Просмотр статистики и отчетов',
		icon: BarChart3,
		href: '/analytics',
		color: 'bg-indigo-500 hover:bg-indigo-600',
	},
	{
		title: 'Настройки',
		description: 'Настройка системы',
		icon: Settings,
		href: '/admin',
		color: 'bg-gray-500 hover:bg-gray-600',
	},
]

export const QuickActions = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Быстрые действия</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid gap-4 md:grid-cols-1 lg:grid-cols-2'>
					{quickActions.map((action, index) => {
						const Icon = action.icon

						return (
							<Link key={index} href={action.href}>
								<div className='h-full flex items-center group p-4 border rounded-lg hover:border-foreground transition-colors cursor-pointer'>
									<div className='flex items-center space-x-3'>
										<div className={`p-2 rounded-lg ${action.color} text-white`}>
											<Icon className='h-5 w-5' />
										</div>
										<div className='flex-1'>
											<h3 className='font-medium text-foreground group-hover:text-muted-foreground'>
												{action.title}
											</h3>
											<p className='text-sm text-muted-foreground mt-1'>{action.description}</p>
										</div>
									</div>
								</div>
							</Link>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}
