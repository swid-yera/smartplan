import type { IAIImportSession } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@ui'

interface ParsingProgressProps {
	importSession: IAIImportSession
}

export const ParsingProgress = ({ importSession }: ParsingProgressProps) => {
	const getStatusText = (status: IAIImportSession['status']) => {
		switch (status) {
			case 'uploading':
				return 'Загрузка файла...'
			case 'parsing':
				return 'Анализ документа ИИ...'
			case 'completed':
				return 'Анализ завершен'
			case 'error':
				return 'Ошибка обработки'
			default:
				return 'Ожидание'
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Прогресс обработки</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					<div>
						<div className='flex justify-between text-sm mb-2'>
							<span>{getStatusText(importSession.status)}</span>
							<span>{importSession.progress}%</span>
						</div>
						<div className='bg-accent w-full rounded-full h-2.5'>
							<div
								className='bg-primary h-2.5 rounded-full transition-all duration-300'
								style={{ width: `${importSession.progress}%` }}
							/>
						</div>
					</div>
					<div className='text-sm text-gray-600'>
						Файл: {importSession.fileName} | Программа: {importSession.programName} | Год:{' '}
						{importSession.academicYear}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
