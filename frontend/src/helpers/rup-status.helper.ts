import type { RupModuleStatus } from '@types'

export const rupStatusLabels: Record<RupModuleStatus, string> = {
	DRAFT: 'Черновик',
	IN_REVIEW: 'На согласовании',
	APPROVED: 'Утверждён',
	REJECTED: 'Отклонен',
}

export const rupStatusVariants: Record<RupModuleStatus, 'default' | 'destructive' | 'outline' | 'secondary'> = {
	DRAFT: 'outline',
	IN_REVIEW: 'secondary',
	APPROVED: 'default',
	REJECTED: 'destructive',
}

export const normalizeRupStatusEnum = (status: RupModuleStatus): string => {
	return rupStatusLabels[status]
}
