'use client'

import Link from 'next/link'

import { getUILocaleSection } from '@helpers'
import { Button, ButtonGroup, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import {
	CheckCircle,
	Edit,
	type LucideIcon,
	MoreVertical,
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
	onOpenStatusSheet: () => void
	onOpenDeleteDialog: () => void
	onSendToReview: () => void
	onOpenRejectSheet: () => void
	onOpenApproveSheet: () => void
}

export const KpiDetailsActions = ({
	id,
	isAdmin,
	isAuthor,
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
	const uiT = getUILocaleSection(uiLocale, locale)

	type IAction =
		| {
				id: string
				label: string
				icon: LucideIcon
				href: string
				onClick?: never
				variant?: 'default' | 'destructive'
		  }
		| {
				id: string
				label: string
				icon: LucideIcon
				onClick: () => void
				href?: never
				variant?: 'default' | 'destructive'
		  }

	const actions: IAction[] = []

	if (isAdmin) {
		actions.push({
			id: 'change-status',
			label: t.changeStatus,
			icon: ShieldAlert,
			onClick: onOpenStatusSheet,
		})
	}

	if (isStatusForEdit && isAuthor) {
		actions.push(
			{
				id: 'edit',
				label: t.edit,
				icon: Edit,
				href: `/kpi/${id}/edit`,
			},
			{
				id: 'send-to-review',
				label: t.sendToReview,
				icon: SendIcon,
				onClick: onSendToReview,
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
		return (
			<ButtonGroup className='flex-wrap'>
				<Button className='hover:text-destructive' size='sm' variant='outline' onClick={onOpenRejectSheet}>
					<SendToBack className='mr-2 h-4 w-4' />
					{t.reject}
				</Button>

				<Button className='hover:text-primary' size='sm' variant='outline' onClick={onOpenApproveSheet}>
					<CheckCircle className='mr-2 h-4 w-4' />
					{t.approve}
				</Button>
			</ButtonGroup>
		)
	}

	const visibleActions = actions.length > 2 ? actions.slice(0, 1) : actions
	const overflowActions = actions.slice(visibleActions.length)

	const renderAction = (action: IAction) =>
		action.href ? (
			<Button asChild key={action.id} className='hover:text-primary' size='sm' variant='outline'>
				<Link href={action.href}>
					<action.icon className='mr-2 h-4 w-4' />
					{action.label}
				</Link>
			</Button>
		) : (
			<Button
				key={action.id}
				className={action.variant === 'destructive' ? 'hover:text-destructive' : 'hover:text-primary'}
				size='sm'
				variant='outline'
				onClick={action.onClick}
			>
				<action.icon className='mr-2 h-4 w-4' />
				{action.label}
			</Button>
		)

	return (
		<ButtonGroup className='w-full flex-wrap justify-end sm:w-auto'>
			{visibleActions.map(renderAction)}

			{overflowActions.length > 0 ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button aria-label={uiT.moreActions} size='icon-sm' type='button' variant='outline'>
							<MoreVertical className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end' className='w-56'>
						{overflowActions.map((action) =>
							action.href ? (
								<DropdownMenuItem key={action.id} asChild>
									<Link href={action.href}>
										<action.icon className='mr-2 h-4 w-4' />
										{action.label}
									</Link>
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem key={action.id} variant={action.variant} onClick={action.onClick}>
									<action.icon className='mr-2 h-4 w-4' />
									{action.label}
								</DropdownMenuItem>
							),
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}
		</ButtonGroup>
	)
}
