'use client'

import Link from 'next/link'

import { getUILocaleSection } from '@helpers'
import { Button, ButtonGroup, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { Edit, FileDown, type LucideIcon, MoreVertical, RotateCcw, SendIcon, ShieldAlert, Trash } from 'lucide-react'

import localeDictionary from '../locale.json'

interface IRupDetailsActionsProps {
	id: string
	isAdmin: boolean
	canViewRups: boolean
	canEdit: boolean
	canSendToReview: boolean
	canDownload: boolean
	canRegenerateLanguage: boolean
	canDelete: boolean
	onOpenStatusSheet: () => void
	onOpenDeleteDialog: () => void
	onOpenDownloadDialog: () => void
	onOpenRegenerateDialog: () => void
	onSendToReview: () => void
}

type IActionBase = {
	id: string
	label: string
	icon: LucideIcon
	variant?: 'default' | 'destructive'
}

type ILinkAction = IActionBase & {
	href: string
	onClick?: never
}

type IClickAction = IActionBase & {
	href?: never
	onClick: () => void
}

export const RupDetailsActions = ({
	id,
	isAdmin,
	canViewRups,
	canEdit,
	canSendToReview,
	canDownload,
	canRegenerateLanguage,
	canDelete,
	onOpenStatusSheet,
	onOpenDeleteDialog,
	onOpenDownloadDialog,
	onOpenRegenerateDialog,
	onSendToReview,
}: IRupDetailsActionsProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).actions

	const availableActions: Array<ILinkAction | IClickAction> = [
		isAdmin && {
			id: 'change-status',
			label: t.changeStatus,
			icon: ShieldAlert,
			onClick: onOpenStatusSheet,
		},
		canEdit && {
			id: 'edit',
			label: t.edit,
			icon: Edit,
			href: `/rups/${id}/edit`,
		},
		canSendToReview && {
			id: 'send-to-review',
			label: t.sendToReview,
			icon: SendIcon,
			onClick: onSendToReview,
		},
		canDownload && {
			id: 'download',
			label: t.download,
			icon: FileDown,
			onClick: onOpenDownloadDialog,
		},
		canRegenerateLanguage && {
			id: 'regenerate',
			label: t.regenerate,
			icon: RotateCcw,
			onClick: onOpenRegenerateDialog,
		},
		canDelete && {
			id: 'delete',
			label: t.delete,
			icon: Trash,
			onClick: onOpenDeleteDialog,
			variant: 'destructive',
		},
	].filter(Boolean) as Array<ILinkAction | IClickAction>

	const primaryActionPriority = isAdmin
		? ['change-status', 'edit', 'send-to-review', 'download', 'regenerate']
		: canViewRups
			? ['edit', 'download', 'send-to-review', 'regenerate']
			: ['download', 'approve', 'reject']

	const primaryAction =
		primaryActionPriority
			.map((actionId) => availableActions.find((action) => action.id === actionId))
			.find(Boolean) ?? null
	const overflowActions = availableActions.filter((action) => action.id !== primaryAction?.id)
	const actionButtonClassName = 'h-9'

	return (
		<ButtonGroup>
			{primaryAction &&
				(primaryAction.href ? (
					<Button asChild className={actionButtonClassName} variant='outline'>
						<Link href={primaryAction.href}>
							<primaryAction.icon className='mr-2 h-4 w-4' />
							{primaryAction.label}
						</Link>
					</Button>
				) : (
					<Button
						className={`${actionButtonClassName} hover:text-primary`}
						variant='outline'
						onClick={primaryAction.onClick}
					>
						<primaryAction.icon className='mr-2 h-4 w-4' />
						{primaryAction.label}
					</Button>
				))}

			{overflowActions.length > 0 && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							aria-label={t.moreActions}
							className={`${actionButtonClassName} px-3`}
							type='button'
							variant='outline'
						>
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
			)}
		</ButtonGroup>
	)
}
