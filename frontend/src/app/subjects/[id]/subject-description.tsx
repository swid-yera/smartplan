import type { ISubject } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@ui'

interface SubjectDescriptionProps {
	subject: ISubject
	updateSubject: (updates: Partial<ISubject>) => void
}

export const SubjectDescription = ({ subject, updateSubject }: SubjectDescriptionProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Описание</CardTitle>
			</CardHeader>
			<CardContent>
				<textarea
					className='w-full h-32 p-2 border rounded-md'
					placeholder='Введите описание предмета...'
					value={subject.description}
					onChange={(e) => updateSubject({ description: e.target.value })}
				/>
			</CardContent>
		</Card>
	)
}
