import type { IExportJob } from '@types'
import { mockExportJobs } from '@types'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@ui'
import { AlertCircle, CheckCircle, Clock, Download, FileText } from 'lucide-react'

export const ExportStatus = () => {
	const exportStats = {
		total: mockExportJobs.length,
		completed: mockExportJobs.filter((job) => job.status === 'completed').length,
		processing: mockExportJobs.filter((job) => job.status === 'processing').length,
		failed: mockExportJobs.filter((job) => job.status === 'failed').length,
		pending: mockExportJobs.filter((job) => job.status === 'pending').length,
	}

	const completionRate = Math.round((exportStats.completed / exportStats.total) * 100)

	const recentExports = mockExportJobs.slice(0, 5)

	const getStatusIcon = (status: IExportJob['status']) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className='h-4 w-4 text-green-500 dark:text-green-400' />
			case 'processing':
				return <Clock className='h-4 w-4 text-blue-500 dark:text-blue-400' />
			case 'failed':
				return <AlertCircle className='h-4 w-4 text-red-500 dark:text-red-400' />
			case 'pending':
				return <Clock className='h-4 w-4 text-yellow-500 dark:text-yellow-400' />
			default:
				return <FileText className='h-4 w-4 text-gray-500 dark:text-gray-400' />
		}
	}

	const getStatusText = (status: IExportJob['status']) => {
		switch (status) {
			case 'completed':
				return 'Завершено'
			case 'processing':
				return 'Обрабатывается'
			case 'failed':
				return 'Ошибка'
			case 'pending':
				return 'Ожидает'
			default:
				return 'Неизвестно'
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center justify-between'>
					<span>Статус экспортов</span>
					<Badge variant='outline'>{completionRate}% завершено</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-6'>
					{/* Progress Overview */}
					<div>
						<div className='flex justify-between text-sm mb-2'>
							<span>Общий прогресс</span>
							<span>
								{exportStats.completed} из {exportStats.total}
							</span>
						</div>
						<div className='w-full bg-accent rounded-full h-2'>
							<div
								className='bg-primary h-2 rounded-full transition-all duration-300'
								style={{ width: `${completionRate}%` }}
							/>
						</div>
					</div>

					{/* Status Summary */}
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<div className='text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg'>
							<div className='flex items-center justify-center mb-1'>
								<CheckCircle className='h-5 w-5 text-green-500 dark:text-green-400' />
							</div>
							<div className='text-2xl font-bold text-green-600 dark:text-green-300'>
								{exportStats.completed}
							</div>
							<div className='text-xs text-green-600 dark:text-green-300'>Завершено</div>
						</div>

						<div className='text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg'>
							<div className='flex items-center justify-center mb-1'>
								<Clock className='h-5 w-5 text-blue-500 dark:text-blue-400' />
							</div>
							<div className='text-2xl font-bold text-blue-600 dark:text-blue-300'>{exportStats.processing}</div>
							<div className='text-xs text-blue-600 dark:text-blue-300'>В процессе</div>
						</div>

						<div className='text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg'>
							<div className='flex items-center justify-center mb-1'>
								<Clock className='h-5 w-5 text-yellow-500 dark:text-yellow-400' />
							</div>
							<div className='text-2xl font-bold text-yellow-600 dark:text-yellow-300'>
								{exportStats.pending}
							</div>
							<div className='text-xs text-yellow-600 dark:text-yellow-300'>Ожидает</div>
						</div>

						<div className='text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg'>
							<div className='flex items-center justify-center mb-1'>
								<AlertCircle className='h-5 w-5 text-red-500 dark:text-red-300' />
							</div>
							<div className='text-2xl font-bold text-red-600 dark:text-red-300'>{exportStats.failed}</div>
							<div className='text-xs text-red-600 dark:text-red-300'>Ошибки</div>
						</div>
					</div>

					{/* Recent Exports */}
					<div>
						<h4 className='font-medium mb-3'>Недавние экспорты</h4>
						<div className='space-y-2'>
							{recentExports.map((job) => (
								<div key={job.id} className='flex items-center justify-between p-3 border rounded-lg'>
									<div className='flex items-center space-x-3'>
										{getStatusIcon(job.status)}
										<div>
											<p className='text-sm font-medium'>{job.rupName}</p>
											<p className='text-xs text-muted-foreground'>
												{job.exportType.toUpperCase()} •{' '}
												{new Date(job.createdAt).toLocaleDateString('ru-RU')}
											</p>
										</div>
									</div>
									<div className='flex items-center space-x-2'>
										<span className='text-xs text-muted-foreground'>{getStatusText(job.status)}</span>
										{job.status === 'completed' && <Download className='h-4 w-4 text-green-500' />}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
