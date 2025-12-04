import Link from 'next/link'

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@ui'
import { BookOpen, Calendar, Clock, ExternalLink, FileText } from 'lucide-react'

interface RecentRUP {
	id: string
	name: string
	programName: string
	academicYear: string
	status: 'draft' | 'published' | 'archived'
	lastModified: string
	subjectCount: number
	totalHours: number
}

const mockRecentRUPs: RecentRUP[] = [
	{
		id: '1',
		name: 'РУП Информатика 2025-2026',
		programName: 'Информатика и вычислительная техника',
		academicYear: '2025-2026',
		status: 'published',
		lastModified: '2025-12-04T10:00:00Z',
		subjectCount: 24,
		totalHours: 2160,
	},
	{
		id: '2',
		name: 'РУП Математика 2025-2026',
		programName: 'Математика',
		academicYear: '2025-2026',
		status: 'draft',
		lastModified: '2025-12-03T15:30:00Z',
		subjectCount: 18,
		totalHours: 1800,
	},
	{
		id: '3',
		name: 'РУП Физика 2024-2025',
		programName: 'Физика',
		academicYear: '2024-2025',
		status: 'published',
		lastModified: '2025-12-02T09:15:00Z',
		subjectCount: 20,
		totalHours: 1950,
	},
	{
		id: '4',
		name: 'РУП Химия 2025-2026',
		programName: 'Химия',
		academicYear: '2025-2026',
		status: 'draft',
		lastModified: '2025-12-01T14:45:00Z',
		subjectCount: 16,
		totalHours: 1680,
	},
]

const getStatusBadge = (status: RecentRUP['status']) => {
	const variants = {
		draft: 'secondary',
		published: 'default',
		archived: 'outline',
	} as const

	const labels = {
		draft: 'Черновик',
		published: 'Опубликован',
		archived: 'Архив',
	}

	return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffDays === 0) return 'сегодня'
	if (diffDays === 1) return 'вчера'
	if (diffDays < 7) return `${diffDays} д назад`

	return date.toLocaleDateString('ru-RU')
}

export const RecentRUPs = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center justify-between'>
					<span>Недавние РУП</span>
					<Link href='/rup'>
						<Button size='sm' variant='outline'>
							<ExternalLink className='h-4 w-4 mr-2' />
							Все РУП
						</Button>
					</Link>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					{mockRecentRUPs.map((rup) => (
						<div key={rup.id} className='p-4 border rounded-lg hover:border-foreground transition-colors'>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-accent rounded-lg'>
									<FileText className='h-5 w-5 text-blue-600 dark:text-blue-400' />
								</div>
								<div className='flex-1 min-w-0'>
									<h3 className='font-medium truncate'>{rup.name}</h3>
									<p className='text-sm text-accent-foreground truncate'>{rup.programName}</p>
									<div className='flex items-center space-x-4 mt-2'>
										<div className='flex items-center text-xs text-muted-foreground'>
											<Calendar className='h-3 w-3 mr-1' />
											{rup.academicYear}
										</div>
										<div className='flex items-center text-xs text-muted-foreground'>
											<BookOpen className='h-3 w-3 mr-1' />
											{rup.subjectCount} предметов
										</div>
										<div className='flex items-center text-xs text-muted-foreground'>
											<Clock className='h-3 w-3 mr-1' />
											{rup.totalHours} ч
										</div>
									</div>
								</div>
							</div>
							<div className='mt-1 flex items-center justify-between space-x-2'>
								<div className='flex items-center space-x-2 text-right'>
									{getStatusBadge(rup.status)}
									<p className='text-xs text-muted-foreground'>{formatDate(rup.lastModified)}</p>
								</div>
								<Link href={`/rup/${rup.id}`}>
									<Button size='sm' variant='outline'>
										Открыть
									</Button>
								</Link>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
