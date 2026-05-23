'use client'

import Link from 'next/link'

import { Button, ButtonGroup } from '@shadcn'
import { CheckCircle, Edit, SendIcon, SendToBack, ShieldAlert, Trash } from 'lucide-react'

interface IKpiDetailsActionsProps {
	id: string
	isAdmin: boolean
	isAwardCreator: boolean
	canEdit: boolean
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
	isAwardCreator,
	canEdit,
	isStatusForEdit,
	isMethodistReview,
	onOpenStatusSheet,
	onOpenDeleteDialog,
	onSendToReview,
	onOpenRejectSheet,
	onOpenApproveSheet,
}: IKpiDetailsActionsProps) => {
	return (
		<ButtonGroup>
			<ButtonGroup>
				{isAdmin && (
					<Button className='hover:text-primary' size='sm' variant='outline' onClick={onOpenStatusSheet}>
						<ShieldAlert />
						Поменять статус
					</Button>
				)}
				{isAwardCreator && (
					<Button className='hover:text-destructive' size='sm' variant='outline' onClick={onOpenDeleteDialog}>
						<Trash />
						Удалить
					</Button>
				)}
				{canEdit && (
					<Button asChild size='sm' variant='outline'>
						<Link href={`/kpi/${id}/edit`}>
							<Edit /> Редактировать
						</Link>
					</Button>
				)}
				{isStatusForEdit && (
					<Button className='hover:text-primary' size='sm' variant='outline' onClick={onSendToReview}>
						<SendIcon />
						Отправить на проверку
					</Button>
				)}
			</ButtonGroup>

			{isMethodistReview && (
				<ButtonGroup>
					<Button className='hover:text-destructive' size='sm' variant='outline' onClick={onOpenRejectSheet}>
						<SendToBack className='mr-2 h-4 w-4' />
						Отклонить
					</Button>

					<Button className='hover:text-primary' size='sm' variant='outline' onClick={onOpenApproveSheet}>
						<CheckCircle className='mr-2 h-4 w-4' />
						Утвердить
					</Button>
				</ButtonGroup>
			)}
		</ButtonGroup>
	)
}
