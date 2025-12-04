import type { IAIParsingResult } from '@types'
import { Card, CardContent, CardHeader, CardTitle, Input } from '@ui'

interface PreviewTableProps {
	parsedData: IAIParsingResult[]
	onUpdateData: (id: string, field: keyof IAIParsingResult, value: string | number) => void
}

export const PreviewTable = ({ parsedData, onUpdateData }: PreviewTableProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Предварительный просмотр (редактируемый)</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<table className='w-full border-collapse border'>
						<thead>
							<tr>
								<th className='border p-2'>Код</th>
								<th className='border p-2'>Название</th>
								<th className='border p-2'>Всего часов</th>
								<th className='border p-2'>Сем1</th>
								<th className='border p-2'>Сем2</th>
								<th className='border p-2'>Лекции</th>
								<th className='border p-2'>Лаб</th>
								<th className='border p-2'>Практика</th>
								<th className='border p-2'>СРС</th>
								<th className='border p-2'>Контроль</th>
								<th className='border p-2'>Уверенность</th>
							</tr>
						</thead>
						<tbody>
							{parsedData.map((item) => (
								<tr key={item.id}>
									<td className='border p-2'>
										<Input
											className='w-full'
											value={item.subjectCode}
											onChange={(e) => onUpdateData(item.id, 'subjectCode', e.target.value)}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											value={item.subjectName}
											onChange={(e) => onUpdateData(item.id, 'subjectName', e.target.value)}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											type='number'
											value={item.totalHours}
											onChange={(e) => onUpdateData(item.id, 'totalHours', parseInt(e.target.value) || 0)}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											type='number'
											value={item.semester1Hours}
											onChange={(e) =>
												onUpdateData(item.id, 'semester1Hours', parseInt(e.target.value) || 0)
											}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											type='number'
											value={item.semester2Hours}
											onChange={(e) =>
												onUpdateData(item.id, 'semester2Hours', parseInt(e.target.value) || 0)
											}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											type='number'
											value={item.lecture}
											onChange={(e) => onUpdateData(item.id, 'lecture', parseInt(e.target.value) || 0)}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											type='number'
											value={item.lab}
											onChange={(e) => onUpdateData(item.id, 'lab', parseInt(e.target.value) || 0)}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											type='number'
											value={item.practice}
											onChange={(e) => onUpdateData(item.id, 'practice', parseInt(e.target.value) || 0)}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											type='number'
											value={item.srs}
											onChange={(e) => onUpdateData(item.id, 'srs', parseInt(e.target.value) || 0)}
										/>
									</td>
									<td className='border p-2'>
										<Input
											className='w-full'
											value={item.controlType}
											onChange={(e) => onUpdateData(item.id, 'controlType', e.target.value)}
										/>
									</td>
									<td className='border p-2 text-center'>
										<span
											className={`px-2 py-1 rounded text-xs ${
												item.confidence > 90
													? 'bg-primary text-accent'
													: item.confidence > 70
														? 'bg-secondary text-accent'
														: 'bg-destructive text-accent'
											}`}
										>
											{item.confidence}%
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	)
}
