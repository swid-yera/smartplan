import type { ISubject } from '@types'
import { Card, CardHeader, CardTitle } from '@ui'

interface SubjectHeaderProps {
	subject: ISubject
}

export const SubjectHeader = ({ subject }: SubjectHeaderProps) => {
	return (
		<Card className='mb-6'>
			<CardHeader>
				<CardTitle className='text-2xl'>
					Редактор предмета: {subject.code} – {subject.name}
				</CardTitle>
			</CardHeader>
		</Card>
	)
}
