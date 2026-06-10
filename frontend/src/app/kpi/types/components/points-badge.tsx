import { Badge } from '@shadcn'
import { formatCriteriaPoints } from '@helpers'

export const PointsBadge = ({ points }: { points: number[] }) => {
	if (!points?.length) return null

	return (
		<Badge variant='secondary'>
			{formatCriteriaPoints(points)} баллов
		</Badge>
	)
}
