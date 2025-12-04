import type { ISubject } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@ui'

interface SubjectRecommendedResourcesProps {
	subject: ISubject
}

export const SubjectRecommendedResources = ({ subject }: SubjectRecommendedResourcesProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Рекомендуемые ресурсы</CardTitle>
			</CardHeader>
			<CardContent>
				<table className='w-full border-collapse border'>
					<thead>
						<tr>
							<th className='border p-2'>Тип</th>
							<th className='border p-2'>Название</th>
							<th className='border p-2'>Автор</th>
							<th className='border p-2'>Год</th>
						</tr>
					</thead>
					<tbody>
						{subject.recommendedResources.map((resource) => (
							<tr key={resource.id}>
								<td className='border p-2'>{resource.type}</td>
								<td className='border p-2'>{resource.title}</td>
								<td className='border p-2'>{resource.author}</td>
								<td className='border p-2'>{resource.year}</td>
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	)
}
