import type { ISubject } from '@types'
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@ui'

interface SubjectHoursBreakdownProps {
	subject: ISubject
	updateSubject: (updates: Partial<ISubject>) => void
}

export const SubjectHoursBreakdown = ({ subject, updateSubject }: SubjectHoursBreakdownProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Распределение часов</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-5 gap-4'>
					<div>
						<Label htmlFor='lecture'>Лекции</Label>
						<Input
							id='lecture'
							type='number'
							value={subject.lecture}
							onChange={(e) => updateSubject({ lecture: parseInt(e.target.value) || 0 })}
						/>
					</div>
					<div>
						<Label htmlFor='lab'>Лабораторные</Label>
						<Input
							id='lab'
							type='number'
							value={subject.lab}
							onChange={(e) => updateSubject({ lab: parseInt(e.target.value) || 0 })}
						/>
					</div>
					<div>
						<Label htmlFor='practice'>Практика</Label>
						<Input
							id='practice'
							type='number'
							value={subject.practice}
							onChange={(e) => updateSubject({ practice: parseInt(e.target.value) || 0 })}
						/>
					</div>
					<div>
						<Label htmlFor='srs'>СРС</Label>
						<Input
							id='srs'
							type='number'
							value={subject.srs}
							onChange={(e) => updateSubject({ srs: parseInt(e.target.value) || 0 })}
						/>
					</div>
					<div>
						<Label htmlFor='project'>Проект</Label>
						<Input
							id='project'
							type='number'
							value={subject.project}
							onChange={(e) => updateSubject({ project: parseInt(e.target.value) || 0 })}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
