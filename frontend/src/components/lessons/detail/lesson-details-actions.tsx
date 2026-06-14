'use client'

import { type PageTitleAction, PageTitleActions } from '@components'
import { getUILocaleSection } from '@helpers'
import { useLocaleStore } from '@store'
import { type Locale } from '@types'
import { Edit, FileDown, RefreshCw, Trash } from 'lucide-react'

import { LocaleToggleButton } from '../../ui/locale-toggle-button'
import localeDictionary from './locale.json'

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

	const actions: PageTitleAction[] = [
		canDownload && {
			id: 'download',
			label: t.openFile,
			icon: FileDown,
			onClick: onDownload,
			pending: isDownloadPending,
			disabled: isDownloadPending,
			priority: 'primary',
		},
		canRegenerate && {
			id: 'regenerate',
			label: t.regenerate,
			icon: RefreshCw,
			onClick: onRegenerate,
			pending: isRegeneratePending,
			disabled: isRegeneratePending,
		},
		canEdit && {
			id: 'edit',
			label: t.edit,
			icon: Edit,
			href: `/lessons/${lessonId}/edit`,
		},
		canDelete && {
			id: 'delete',
			label: t.delete,
			icon: Trash,
			onClick: onDelete,
			variant: 'destructive',
			pending: isDeletePending,
			disabled: isDeletePending,
		},
	].filter(Boolean) as PageTitleAction[]

	return (
		<PageTitleActions
			actions={actions}
			moreLabel={t.moreActions}
			trailing={
				<LocaleToggleButton
					activeLocale={activeLocale}
					labels={{ kk: t.languageKk, ru: t.languageRu }}
					onChangeLocale={onActiveLocaleChange}
				/>
			}
		/>
	)
}
