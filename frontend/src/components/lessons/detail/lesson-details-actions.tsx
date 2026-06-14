'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getUILocaleSection } from '@helpers'
import { Button, ButtonGroup, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type Locale } from '@types'
import { Edit, FileDown, Loader2, type LucideIcon, MoreVertical, RefreshCw, Trash } from 'lucide-react'

import { LocaleToggleButton } from '../../ui/locale-toggle-button'
import localeDictionary from './locale.json'

type LessonAction = {
	id: string
	label: string
	icon: LucideIcon
	variant?: 'default' | 'destructive'
	onClick?: () => void
	href?: string
}

interface LessonDetailsActionsProps {
	activeLocale: Locale
	canDelete: boolean
	canDownload: boolean
	canEdit: boolean
	canRegenerate: boolean
	isDeletePending: boolean
	isDownloadPending: boolean
	isRegeneratePending: boolean
	lessonId: string
	onActiveLocaleChange: (locale: Locale) => void
	onDelete: () => void
	onDownload: () => void
	onRegenerate: () => void
}

export function LessonDetailsActions({
	activeLocale,
	canDelete,
	canDownload,
	canEdit,
	canRegenerate,
	isDeletePending,
	isDownloadPending,
	isRegeneratePending,
	lessonId,
	onActiveLocaleChange,
	onDelete,
	onDownload,
	onRegenerate,
}: LessonDetailsActionsProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const router = useRouter()

	const primaryAction: LessonAction | null = canDownload
		? {
				id: 'download',
				label: t.openFile,
				icon: FileDown,
				onClick: onDownload,
			}
		: canEdit
			? {
					id: 'edit',
					label: t.edit,
					icon: Edit,
					href: `/lessons/${lessonId}/edit`,
				}
			: canRegenerate
				? {
						id: 'regenerate',
						label: t.regenerate,
						icon: RefreshCw,
						onClick: onRegenerate,
					}
				: null

	const overflowActions: LessonAction[] = []

	if (primaryAction?.id !== 'regenerate' && canRegenerate) {
		overflowActions.push({
			id: 'regenerate',
			label: t.regenerate,
			icon: RefreshCw,
			onClick: onRegenerate,
		})
	}

	if (primaryAction?.id !== 'edit' && canEdit) {
		overflowActions.push({
			id: 'edit',
			label: t.edit,
			icon: Edit,
			onClick: () => router.push(`/lessons/${lessonId}/edit`),
		})
	}

	if (canDelete) {
		overflowActions.push({
			id: 'delete',
			label: t.delete,
			icon: Trash,
			onClick: onDelete,
			variant: 'destructive',
		})
	}

	return (
		<ButtonGroup className='w-full flex-wrap justify-end sm:w-auto'>
			{primaryAction ? (
				primaryAction.href ? (
					<Button asChild className='h-9' variant='outline'>
						<Link href={primaryAction.href}>
							<primaryAction.icon className='mr-2 h-4 w-4' />
							{primaryAction.label}
						</Link>
					</Button>
				) : (
					<Button
						className='h-9 hover:text-primary'
						disabled={
							(primaryAction.id === 'regenerate' && isRegeneratePending) ||
							(primaryAction.id === 'download' && isDownloadPending)
						}
						variant='outline'
						onClick={primaryAction.onClick}
					>
						{primaryAction.id === 'download' && isDownloadPending ? (
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
						) : (
							<primaryAction.icon className='mr-2 h-4 w-4' />
						)}
						{primaryAction.label}
					</Button>
				)
			) : null}

			{overflowActions.length > 0 ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button aria-label={t.moreActions} className='h-9 px-3' type='button' variant='outline'>
							<MoreVertical className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end' className='w-56'>
						{overflowActions.map((action) => (
							<DropdownMenuItem
								key={action.id}
								disabled={
									(action.id === 'delete' && isDeletePending) ||
									(action.id === 'download' && isDownloadPending)
								}
								variant={action.variant}
								onClick={action.onClick}
							>
								<action.icon className='mr-2 h-4 w-4' />
								{action.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}

			<LocaleToggleButton
				activeLocale={activeLocale}
				labels={{ kk: t.languageKk, ru: t.languageRu }}
				onChangeLocale={onActiveLocaleChange}
			/>
		</ButtonGroup>
	)
}
