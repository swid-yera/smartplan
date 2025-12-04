import type { IGroup } from '@types'
import { Card, CardHeader, CardTitle } from '@ui'

interface TimetableHeaderProps {
	group: IGroup
}

export const TimetableHeader = ({ group }: TimetableHeaderProps) => {
	return (
		<Card className='mb-6'>
			<CardHeader>
				<CardTitle className='text-2xl'>
					Расписание группы: {group.name} | Семестр {group.semester}
				</CardTitle>
			</CardHeader>
		</Card>
	)
}
