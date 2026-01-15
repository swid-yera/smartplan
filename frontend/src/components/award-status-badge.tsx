import { AwardStatusEnum } from '@types'
import { Badge } from '@ui'

export const statusLabel: Record<AwardStatusEnum, string> = {
	DRAFT: 'Черновик',
	IN_REVIEW: 'На проверке',
	APPROVED: 'Подтверждено',
	REJECTED: 'Отклонено',
}

export function AwardStatusBadge({ status }: { status: AwardStatusEnum }) {
	return (
		<Badge
			variant={
				status === AwardStatusEnum.APPROVED
					? 'default'
					: status === AwardStatusEnum.REJECTED
						? 'destructive'
						: 'secondary'
			}
		>
			{statusLabel[status]}
		</Badge>
	)
}
