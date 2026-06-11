import { formatCriteriaPoints } from '@helpers'
import { Badge } from '@shadcn'

export const PointsBadge = ({ points }: { points: number[] }) => {
	if (!points?.length) return null

	return <Badge variant='secondary'>{formatCriteriaPoints(points)} баллов</Badge>
}
