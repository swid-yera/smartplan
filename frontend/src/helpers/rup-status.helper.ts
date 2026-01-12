import type { RupModuleStatus } from '@types'

export const statusLabels: Record<RupModuleStatus, string> = {
	DRAFT: 'Черновик',
	IN_REVIEW: 'На согласовании',
	APPROVED: 'Утверждён',
}

export const statusVariants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
	DRAFT: 'secondary',
	IN_REVIEW: 'default',
	APPROVED: 'default',
}

export const statusEnumToString = (status: RupModuleStatus): string => {
	return statusLabels[status]
}
