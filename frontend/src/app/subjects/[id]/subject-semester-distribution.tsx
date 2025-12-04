import type { ISubject } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@ui'

interface SubjectSemesterDistributionProps {
	subject: ISubject
}

export const SubjectSemesterDistribution = ({ subject }: SubjectSemesterDistributionProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Распределение по семестрам</CardTitle>
			</CardHeader>
			<CardContent>
				<table className='w-full border-collapse border'>
					<thead>
						<tr>
							<th className='border p-2'>Семестр</th>
							<th className='border p-2'>Лекции</th>
							<th className='border p-2'>Лаб</th>
							<th className='border p-2'>Практика</th>
							<th className='border p-2'>СРС</th>
							<th className='border p-2'>Проект</th>
							<th className='border p-2'>Итого</th>
						</tr>
					</thead>
					<tbody>
						{subject.semesterDistribution.map((dist, index) => (
							<tr key={index}>
								<td className='border p-2'>{dist.semester}</td>
								<td className='border p-2'>{dist.lecture}</td>
								<td className='border p-2'>{dist.lab}</td>
								<td className='border p-2'>{dist.practice}</td>
								<td className='border p-2'>{dist.srs}</td>
								<td className='border p-2'>{dist.project}</td>
								<td className='border p-2 font-bold'>{dist.total}</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	)
}
