'use client'

import { PageTitleActions, type PageTitleAction } from '@components'
import { getUILocaleSection } from '@helpers'
import { useLocaleStore } from '@store'
import {
	BadgeDollarSign,
	CheckCircle,
	Edit,
	SendIcon,
	SendToBack,
	ShieldAlert,
	Trash,
} from 'lucide-react'

import uiLocale from '../../../../components/ui/locale.json'
import localeDictionary from './locale.json'

interface IKpiDetailsActionsProps {
	id: string
	isAdmin: boolean
	isAuthor: boolean
	isStatusForEdit: boolean
	isMethodistReview: boolean
	canChangePoints: boolean
	onOpenStatusSheet: () => void
	onOpenDeleteDialog: () => void
	onSendToReview: () => void
	onOpenRejectSheet: () => void
	onOpenApproveSheet: () => void
	onOpenChangePointsSheet: () => void
}

export const KpiDetailsActions = ({
	id,
	isAdmin,
	isAuthor,
	isStatusForEdit,
	isMethodistReview,
	canChangePoints,
	onOpenStatusSheet,
	onOpenDeleteDialog,
	onSendToReview,
	onOpenRejectSheet,
	onOpenApproveSheet,
	onOpenChangePointsSheet,
}: IKpiDetailsActionsProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).actions
	const uiT = getUILocaleSection(uiLocale, locale)

	const actions: PageTitleAction[] = []

	if (isAdmin) {
		actions.push({
			id: 'change-status',
			label: t.changeStatus,
			icon: ShieldAlert,
			onClick: onOpenStatusSheet,
			priority: 'overflow',
		})
	}

	if (canChangePoints && !isMethodistReview) {
		actions.push({
			id: 'change-points',
			label: t.changePoints,
			icon: BadgeDollarSign,
			onClick: onOpenChangePointsSheet,
		})
	}

	if (isStatusForEdit && isAuthor) {
		actions.push(
			{
				id: 'send-to-review',
				label: t.sendToReview,
				icon: SendIcon,
				onClick: onSendToReview,
			},
			{
				id: 'edit',
				label: t.edit,
				icon: Edit,
				href: `/kpi/${id}/edit`,
			},
			{
				id: 'delete',
				label: t.delete,
				icon: Trash,
				onClick: onOpenDeleteDialog,
				variant: 'destructive',
			},
		)
	}

	if (isMethodistReview) {
		actions.push(
			{
				id: 'approve',
				label: t.approve,
				icon: CheckCircle,
				onClick: onOpenApproveSheet,
			},
			{
				id: 'reject',
				label: t.reject,
				icon: SendToBack,
				onClick: onOpenRejectSheet,
				variant: 'destructive',
			},
		)
	}

	return <PageTitleActions actions={actions} moreLabel={uiT.moreActions} />
}
