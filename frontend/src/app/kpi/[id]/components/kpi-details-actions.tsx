'use client'

import Link from 'next/link'

import { getUILocaleSection } from '@helpers'
import { Button, ButtonGroup } from '@shadcn'
import { useLocaleStore } from '@store'
import { CheckCircle, Edit, SendIcon, SendToBack, ShieldAlert, Trash } from 'lucide-react'

import localeDictionary from './locale.json'

interface IKpiDetailsActionsProps {
	id: string
	isAdmin: boolean
	canManage: boolean
	isStatusForEdit: boolean
	isMethodistReview: boolean
	onOpenStatusSheet: () => void
	onOpenDeleteDialog: () => void
	onSendToReview: () => void
	onOpenRejectSheet: () => void
	onOpenApproveSheet: () => void
}

export const KpiDetailsActions = ({
	id,
	isAdmin,
	canManage,
	isStatusForEdit,
	isMethodistReview,
	onOpenStatusSheet,
	onOpenDeleteDialog,
	onSendToReview,
	onOpenRejectSheet,
	onOpenApproveSheet,
}: IKpiDetailsActionsProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).actions

	return (
		<ButtonGroup>
			<ButtonGroup>
				{isAdmin && (
					<Button className='hover:text-primary' size='sm' variant='outline' onClick={onOpenStatusSheet}>
						<ShieldAlert />
						{t.changeStatus}
					</Button>
				)}
				{canManage && (
					<Button className='hover:text-destructive' size='sm' variant='outline' onClick={onOpenDeleteDialog}>
						<Trash />
						{t.delete}
					</Button>
				)}
				{canManage && (
					<Button asChild size='sm' variant='outline'>
						<Link href={`/kpi/${id}/edit`}>
							<Edit /> {t.edit}
						</Link>
					</Button>
				)}
				{isStatusForEdit && (
					<Button className='hover:text-primary' size='sm' variant='outline' onClick={onSendToReview}>
						<SendIcon />
						{t.sendToReview}
					</Button>
				)}
			</ButtonGroup>

			{isMethodistReview && (
				<ButtonGroup>
					<Button className='hover:text-destructive' size='sm' variant='outline' onClick={onOpenRejectSheet}>
						<SendToBack className='mr-2 h-4 w-4' />
						{t.reject}
					</Button>

					<Button className='hover:text-primary' size='sm' variant='outline' onClick={onOpenApproveSheet}>
						<CheckCircle className='mr-2 h-4 w-4' />
						{t.approve}
					</Button>
				</ButtonGroup>
			)}
		</ButtonGroup>
	)
}
