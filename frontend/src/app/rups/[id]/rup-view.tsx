import { type FC, type ReactNode, useState } from 'react'

import Link from 'next/link'

import { LocaleToggleButton, PageTitle, ResponsibleUsersCard, RupReviewSheets, StatusBadge } from '@components'
import { formatHours, getLocaleText, getUILocaleSection, normalizeStudyForm } from '@helpers'
import { Button, ButtonGroup, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IKriptoKeyPayload, type IRup, type IRupSignatureArtifact, type Locale, StatusEnum } from '@types'
import {
	CheckCircle,
	Edit,
	FileDown,
	type LucideIcon,
	Loader2,
	MoreVertical,
	RefreshCw,
	Search,
	SendIcon,
	SendToBack,
	ShieldAlert,
	Timer,
	Trash,
} from 'lucide-react'

import { ContactsView, DisciplineView, ExplorationView, TopicsView } from '../components'
import { BasicView } from '../components/view/basic-view'
import localeDictionary from './locale.json'

interface IRupViewProps {
	data: IRup
	canManage: boolean
	canFullAccess: boolean
	canEdit: boolean
	canSendToReview: boolean
	canDownload: boolean
	canRegenerateLanguage: boolean
	canDelete: boolean
	activeLocale: Locale
	kriptoArtifact?: IRupSignatureArtifact
	localeNotice?: ReactNode
	onActiveLocaleChange: (nextLocale: Locale) => void
	onStatusChange: (
		newStatus: StatusEnum,
		options?: {
			reason?: string
			keyId?: string
			userId?: string
			password?: string
			confirmed?: boolean
			kripto?: IKriptoKeyPayload
		},
	) => void
	onOpenStatusSheet: () => void
	onOpenDeleteDialog: () => void
	onOpenDownloadDialog: () => void
	onOpenRegenerateDialog: () => void
	onSendToReview: () => void
	isDeletePending: boolean
	isRegeneratePending: boolean
	isDownloadPending: boolean
}

export const RupView: FC<IRupViewProps> = ({
	data,
	canManage,
	canFullAccess,
	canEdit,
	canSendToReview,
	canDownload,
	canRegenerateLanguage,
	canDelete,
	activeLocale,
	localeNotice,
	onActiveLocaleChange,
	onStatusChange,
	onOpenStatusSheet,
	onOpenDeleteDialog,
	onOpenDownloadDialog,
	onOpenRegenerateDialog,
	onSendToReview,
	isDeletePending,
	isRegeneratePending,
	isDownloadPending,
	kriptoArtifact,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const localeText = getUILocaleSection(localeDictionary, locale)
	const t = getUILocaleSection(localeDictionary, activeLocale).view
	const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false)
	const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false)
	const actionsText = localeText.actions
	const isMethodistReview = canManage && data.status === StatusEnum.IN_REVIEW

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
		disabled?: boolean
	}

	const availableActions: Array<ILinkAction | IClickAction> = [
		canFullAccess && {
			id: 'change-status',
			label: actionsText.changeStatus,
			icon: ShieldAlert,
			onClick: onOpenStatusSheet,
		},
		canEdit && {
			id: 'edit',
			label: actionsText.edit,
			icon: Edit,
			href: `/rups/${data.id}/edit`,
		},
		canSendToReview && {
			id: 'send-to-review',
			label: actionsText.sendToReview,
			icon: SendIcon,
			onClick: onSendToReview,
		},
		canDownload && {
			id: 'download',
			label: actionsText.download,
			icon: FileDown,
			onClick: onOpenDownloadDialog,
		},
		canRegenerateLanguage && {
			id: 'regenerate',
			label: actionsText.regenerate,
			icon: RefreshCw,
			onClick: onOpenRegenerateDialog,
		},
		isMethodistReview && {
			id: 'approve',
			label: t.approve,
			icon: CheckCircle,
			onClick: () => setIsApproveSheetOpen(true),
		},
		isMethodistReview && {
			id: 'reject',
			label: t.reject,
			icon: SendToBack,
			onClick: () => setIsRejectSheetOpen(true),
			variant: 'destructive',
		},
		canDelete && {
			id: 'delete',
			label: actionsText.delete,
			icon: Trash,
			onClick: onOpenDeleteDialog,
			variant: 'destructive',
		},
	].filter(Boolean) as Array<ILinkAction | IClickAction>

	const primaryAction = availableActions[0] ?? null
	const overflowActions = availableActions.slice(1)

	const renderAction = (action: ILinkAction | IClickAction) =>
		action.href ? (
			<Button asChild key={action.id} className='h-9' variant='outline'>
				<Link href={action.href}>
					<action.icon className='mr-2 h-4 w-4' />
					{action.label}
				</Link>
			</Button>
		) : (
			<Button
				key={action.id}
				className={action.variant === 'destructive' ? 'h-9 hover:text-destructive' : 'h-9 hover:text-primary'}
				disabled={
					(action.id === 'regenerate' && isRegeneratePending) ||
					(action.id === 'delete' && isDeletePending) ||
					(action.id === 'download' && isDownloadPending)
				}
				variant='outline'
				onClick={action.onClick}
			>
				{action.id === 'download' && isDownloadPending ? (
					<Loader2 className='mr-2 h-4 w-4 animate-spin' />
				) : (
					<action.icon className='mr-2 h-4 w-4' />
				)}
				{action.label}
			</Button>
		)

	return (
		<div className='w-full mx-auto relative'>
			<PageTitle
				sticky
				actions={
					<ButtonGroup className='sm:w-auto'>
						{primaryAction ? renderAction(primaryAction) : null}

						{overflowActions.length > 0 ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										aria-label={actionsText.moreActions}
										className='h-9 px-3'
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
											<DropdownMenuItem
												key={action.id}
												disabled={
													(action.id === 'regenerate' && isRegeneratePending) ||
													(action.id === 'delete' && isDeletePending) ||
													(action.id === 'download' && isDownloadPending)
												}
												variant={action.variant}
												onClick={action.onClick}
											>
												{action.id === 'download' && isDownloadPending ? (
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												) : (
													<action.icon className='mr-2 h-4 w-4' />
												)}
												{action.label}
											</DropdownMenuItem>
										),
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						) : null}

						<LocaleToggleButton
							activeLocale={activeLocale}
							labels={{ kk: t.languageKk, ru: t.languageRu }}
							variant='default'
							onChangeLocale={onActiveLocaleChange}
						/>
					</ButtonGroup>
				}
				description={canManage ? t.reviewDescription : t.readOnlyDescription}
			>
				{` ${getLocaleText(data.name, activeLocale) || `${t.titleFallback} `} `}
				<StatusBadge locale={activeLocale} status={data.status} />
			</PageTitle>

			<div className='space-y-6 px-4 py-6'>
				{data.status === StatusEnum.REJECTED && (
					<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
						<div className='flex items-center gap-2 font-medium'>
							<ShieldAlert className='h-5 w-5' />
							{t.rejectedReasonTitle}
						</div>
						<div className='mt-2 text-sm whitespace-pre-wrap'>{data.reason || t.empty}</div>
					</div>
				)}
				{data.status === StatusEnum.IN_REVIEW && (
					<div className='rounded-lg border border-secondary/50 bg-secondary/5 p-4 text-secondary'>
						<div className='flex items-center gap-2 font-semibold'>
							<Timer className='h-5 w-5' />
							{t.waitingMessage}
						</div>
					</div>
				)}
				{data.status === StatusEnum.DRAFT && (
					<div className='rounded-lg border border-primary/50 bg-primary/5 p-4 text-primary'>
						<div className='flex items-center gap-2 font-semibold'>
							<Search className='h-5 w-5' />
							{t.draftMessage}
						</div>
					</div>
				)}
				{data.status === StatusEnum.APPROVED && (
					<div className='rounded-lg border border-muted-foreground/50 bg-muted-foreground/5 p-4 text-muted-foreground'>
						<div className='flex items-center gap-2 font-semibold'>
							<Search className='h-5 w-5' />
							{t.approvedMessage}
						</div>
					</div>
				)}
				{localeNotice}

				<div className='mt-6 grid gap-6 xl:grid-cols-4 lg:grid-cols-3'>
					<BasicView
						className='xl:col-span-3 lg:col-span-2'
						rows={[
							{
								label: t.moduleName,
								subLabel: t.moduleNameSub,
								value: getLocaleText(data.name, activeLocale),
							},
							{
								label: t.specialty,
								subLabel: t.specialtySub,
								value: getLocaleText(data.groups[0]?.specialty, activeLocale),
							},
							{
								label: t.qualification,
								subLabel: t.qualificationSub,
								value: getLocaleText(data.groups[0]?.qualification, activeLocale),
							},
							{
								label: t.studyForm,
								value: normalizeStudyForm(data.studyForm, activeLocale),
							},
							{
								label: t.totalHours,
								value: formatHours(data.totalHours, activeLocale),
							},
							{
								label: t.credits,
								value: data.totalHours / 24,
							},
							{
								label: t.course,
								value: `${data.course} ${t.courseSuffix}`,
							},
							{
								label: t.group,
								value: data.groups[0].name,
							},
							{
								label: t.developers,
								value: (
									<ul className='list-decimal ml-3'>
										{data.contacts.map((c) => (
											<li key={c.keycloakId}>{`${c.firstName} ${c.lastName}`}</li>
										))}
									</ul>
								),
							},
						]}
						title={t.moduleTitle}
					/>

					<ResponsibleUsersCard
						createdAt={data.createdAt}
						localeCode={activeLocale}
						methodist={data.methodist}
						teacher={data.teacher}
						updatedAt={data.updatedAt}
					/>
				</div>

				<ExplorationView activeLocale={activeLocale} data={data} />

				<ContactsView activeLocale={activeLocale} contacts={data.contacts} creatorId={data.teacher.keycloakId} />

				<DisciplineView activeLocale={activeLocale} disciplines={data.disciplines} rupName={data.name} />

				<TopicsView
					activeLocale={activeLocale}
					disciplines={data.disciplines}
					rupId={data.id}
					rupStatus={data.status}
					type={data.type}
				/>

				{kriptoArtifact && (
					<div className='rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm'>
						{kriptoArtifact.qrSvg && (
							<div className='flex justify-center'>
								<div className='rounded-2xl border bg-background p-3 shadow-sm'>
									<img
										alt={t.kriptoTitle}
										className='h-56 w-56 object-contain'
										src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(kriptoArtifact.qrSvg)}`}
									/>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			<RupReviewSheets
				canManage={canManage}
				data={data}
				isApproveSheetOpen={isApproveSheetOpen}
				isRejectSheetOpen={isRejectSheetOpen}
				text={localeText}
				onApproveSheetOpenChange={setIsApproveSheetOpen}
				onRejectSheetOpenChange={setIsRejectSheetOpen}
				onStatusChange={onStatusChange}
			/>
		</div>
	)
}
