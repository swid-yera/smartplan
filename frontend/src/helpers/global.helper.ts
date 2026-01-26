import type { ForwardRefExoticComponent, RefAttributes } from 'react'

import type { IPagination, StatusEnum } from '@types'
import type { badgeVariants } from '@ui'
import type { VariantProps } from 'class-variance-authority'
import { BanIcon, CheckCheckIcon, type LucideProps, PencilIcon, TextSearchIcon } from 'lucide-react'

// format value as dash
export const formatAsDash = (value: number | string = 0): string => {
	if (typeof value == 'number') {
		return value == 0 ? '—' : value.toString()
	}

	return !value ? '—' : value
}

// generate empty meta pagination
export const generateEmptyMetaPagination = (): IPagination<''>['meta'] => {
	return { currentPage: 1, pages: 1, total: 0, pageSize: 10 }
}

// status
export const statusLabels: Record<StatusEnum, string> = {
	DRAFT: 'Черновик',
	IN_REVIEW: 'На проверке',
	APPROVED: 'Утверждён',
	REJECTED: 'Отклонен',
}

export const statusIcons: Record<
	StatusEnum,
	ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
> = {
	DRAFT: PencilIcon,
	IN_REVIEW: TextSearchIcon,
	APPROVED: CheckCheckIcon,
	REJECTED: BanIcon,
}

export const statusVariants: Record<StatusEnum, VariantProps<typeof badgeVariants>['variant']> = {
	DRAFT: 'outline',
	IN_REVIEW: 'secondary',
	APPROVED: 'default',
	REJECTED: 'destructive',
}

export const normalizeStatus = (status: StatusEnum): string => {
	return statusLabels[status] ?? ''
}
