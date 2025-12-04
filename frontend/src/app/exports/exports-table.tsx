import type { IExportJob } from '@types'
import { Badge, Button } from '@ui'

interface ExportsTableProps {
	exportJobs: IExportJob[]
	onDownload: (job: IExportJob) => void
}

export const ExportsTable = ({ exportJobs, onDownload }: ExportsTableProps) => {
	const getStatusBadge = (status: IExportJob['status']) => {
		const variants = {
			pending: 'secondary',
			processing: 'default',
			completed: 'default',
			failed: 'destructive',
		} as const

		const labels = {
			pending: 'Ожидает',
			processing: 'Обрабатывается',
			completed: 'Завершено',
			failed: 'Ошибка',
		}

		return <Badge variant={variants[status]}>{labels[status]}</Badge>
	}

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return '-'
		const mb = bytes / (1024 * 1024)

		return `${mb.toFixed(1)} MB`
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString('ru-RU')
	}

	return (
		<div className='overflow-x-auto'>
			<table className='w-full border-collapse border'>
				<thead>
					<tr>
						<th className='border text-left pl-3 py-2'>РУП</th>
						<th className='border text-left pl-3 py-2'>Программа</th>
						<th className='border text-left pl-3 py-2'>Год</th>
						<th className='border text-left pl-3 py-2'>Тип</th>
						<th className='border text-left pl-3 py-2'>Дата создания</th>
						<th className='border text-left pl-3 py-2'>Статус</th>
						<th className='border text-left pl-3 py-2'>Размер</th>
						<th className='border text-left pl-3 py-2'>Действия</th>
					</tr>
				</thead>
				<tbody>
					{exportJobs.map((job) => (
						<tr key={job.id}>
							<td className='border p-3'>{job.rupName}</td>
							<td className='border p-3'>{job.programName}</td>
							<td className='border p-3'>{job.academicYear}</td>
							<td className='border p-3'>
								<Badge variant='outline'>{job.exportType.toUpperCase()}</Badge>
							</td>
							<td className='border p-3'>{formatDate(job.createdAt)}</td>
							<td className='border p-3'>{getStatusBadge(job.status)}</td>
							<td className='border p-3'>{formatFileSize(job.fileSize)}</td>
							<td className='border p-3'>
								{job.status === 'completed' && job.downloadUrl && (
									<Button size='sm' onClick={() => onDownload(job)}>
										Скачать
									</Button>
								)}
								{job.status === 'failed' && job.errorMessage && (
									<span className='text-red-600 text-sm'>{job.errorMessage}</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
