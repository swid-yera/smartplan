import { Badge } from '@shadcn'

export const PointsBadge = ({ points }: { points: number[] }) => {
	if (!points?.length) return null

	return (
		<Badge variant='secondary'>
			{points.length === 1 ? `${points[0]} баллов` : `${points[0]}–${points[1]} баллов`}
		</Badge>
	)
}
