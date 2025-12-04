import type { ISubject } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@ui'

interface SubjectPrerequisitesProps {
	subject: ISubject
	updateSubject: (updates: Partial<ISubject>) => void
}

export const SubjectPrerequisites = ({ subject, updateSubject }: SubjectPrerequisitesProps) => {
	const availableSubjects = ['MATH101', 'PHYS101', 'CHEM101', 'PROG101']

	const togglePrerequisite = (prereq: string) => {
		const newPrereqs = subject.prerequisites.includes(prereq)
			? subject.prerequisites.filter((p) => p !== prereq)
			: [...subject.prerequisites, prereq]

		updateSubject({ prerequisites: newPrereqs })
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Предварительные требования</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					{availableSubjects.map((prereq) => (
						<label key={prereq} className='flex items-center space-x-2'>
							<input
								checked={subject.prerequisites.includes(prereq)}
								type='checkbox'
								onChange={() => togglePrerequisite(prereq)}
							/>
							<span>{prereq}</span>
						</label>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
