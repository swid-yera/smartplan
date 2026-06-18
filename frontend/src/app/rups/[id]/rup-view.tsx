import { type FC, type ReactNode, memo, useMemo, useState } from 'react'

import {
	LocaleToggleButton,
	PageTitle,
	PageTitleActions,
	ResponsibleUsersCard,
	RupReviewSheets,
	StatusBadge,
} from '@components'
import { formatHours, getLocaleText, getUILocaleSection, normalizeStudyForm } from '@helpers'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Separator,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IKriptoKeyPayload, type IRup, type IRupSignatureArtifact, type Locale, StatusEnum } from '@types'
import {
	CheckCircle,
	Edit,
	ExternalLink,
	FileDown,
	type LucideIcon,
	QrCode,
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

type RupViewText = (typeof localeDictionary)['ru']['view']

interface IRupMainContentProps {
	data: IRup
	activeLocale: Locale
	kriptoArtifact?: IRupSignatureArtifact
	t: RupViewText
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
	console.log(data)

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
		disabled?: boolean
		pending?: boolean
		priority?: 'primary' | 'normal' | 'overflow'
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

	const availableActions = useMemo(
		() =>
			[
				canFullAccess && {
					id: 'change-status',
					label: actionsText.changeStatus,
					icon: ShieldAlert,
					onClick: onOpenStatusSheet,
					priority: 'overflow',
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
					disabled: isDownloadPending,
					pending: isDownloadPending,
				},
				canRegenerateLanguage && {
					id: 'regenerate',
					label: actionsText.regenerate,
					icon: RefreshCw,
					onClick: onOpenRegenerateDialog,
					disabled: isRegeneratePending,
					pending: isRegeneratePending,
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
					disabled: isDeletePending,
				},
			].filter(Boolean) as Array<ILinkAction | IClickAction>,
		[
			actionsText.changeStatus,
			actionsText.delete,
			actionsText.download,
			actionsText.edit,
			actionsText.regenerate,
			actionsText.sendToReview,
			canDelete,
			canDownload,
			canEdit,
			canFullAccess,
			canRegenerateLanguage,
			canSendToReview,
			data.id,
			isDeletePending,
			isDownloadPending,
			isMethodistReview,
			isRegeneratePending,
			onOpenDeleteDialog,
			onOpenDownloadDialog,
			onOpenRegenerateDialog,
			onOpenStatusSheet,
			onSendToReview,
			t.approve,
			t.reject,
		],
	)

	return (
		<div className='w-full mx-auto relative'>
			<PageTitle
				sticky
				actions={
					<PageTitleActions
						actions={availableActions}
						moreLabel={actionsText.moreActions}
						trailing={
							<LocaleToggleButton
								activeLocale={activeLocale}
								labels={{ kk: t.languageKk, ru: t.languageRu }}
								variant='default'
								onChangeLocale={onActiveLocaleChange}
							/>
						}
					/>
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

				<RupMainContent activeLocale={activeLocale} data={data} kriptoArtifact={kriptoArtifact} t={t} />
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

const RupMainContent = memo(({ data, activeLocale, kriptoArtifact, t }: IRupMainContentProps) => {
	const totalHours = useMemo(() => {
		const calculatedTotalHours = data.disciplines.reduce((sum, discipline) => {
			const semesterHours = discipline.semesters.reduce((disciplineSum, semester) => {
				return disciplineSum + (semester.totalHours || 0)
			}, 0)
			const srspHours = discipline.topics.reduce((disciplineSum, topic) => {
				return disciplineSum + (topic.srspHours || 0)
			}, 0)

			return sum + semesterHours + srspHours
		}, 0)

		return calculatedTotalHours || data.totalHours
	}, [data.disciplines, data.totalHours])

	return (
		<>
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
							value: formatHours(totalHours, activeLocale),
						},
						{
							label: t.credits,
							value: totalHours / 24,
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

			<div className='[content-visibility:auto] [contain-intrinsic-size:640px]'>
				<ExplorationView activeLocale={activeLocale} data={data} />
			</div>

			<ContactsView activeLocale={activeLocale} contacts={data.contacts} creatorId={data.teacher.keycloakId} />

			<div className='[content-visibility:auto] [contain-intrinsic-size:760px]'>
				<DisciplineView activeLocale={activeLocale} disciplines={data.disciplines} rupName={data.name} />
			</div>

			<div className='[content-visibility:auto] [contain-intrinsic-size:1200px]'>
				<TopicsView
					activeLocale={activeLocale}
					disciplines={data.disciplines}
					rupId={data.id}
					rupStatus={data.status}
					type={data.type}
				/>
			</div>

			{kriptoArtifact && <KriptoSignatureCard activeLocale={activeLocale} artifact={kriptoArtifact} t={t} />}
		</>
	)
})

RupMainContent.displayName = 'RupMainContent'

interface IKriptoSignatureCardProps {
	artifact: IRupSignatureArtifact
	activeLocale: Locale
	t: RupViewText
}

const KriptoSignatureCard = memo(({ artifact, activeLocale, t }: IKriptoSignatureCardProps) => {
	const dateLocale = activeLocale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const signedAt = new Date(artifact.createdAt).toLocaleString(dateLocale)
	const documentHash =
		artifact.documentHash.length > 18 ? `${artifact.documentHash.slice(0, 18)}...` : artifact.documentHash

	return (
		<Card>
			<CardHeader className='gap-2'>
				<div className='flex flex-wrap items-start justify-between gap-3'>
					<div className='flex flex-col gap-1'>
						<CardTitle className='flex items-center gap-2 text-xl'>
							<QrCode className='h-5 w-5' />
							{t.kriptoTitle}
						</CardTitle>
						<CardDescription>{t.kriptoDescription}</CardDescription>
					</div>
					<Badge variant='secondary'>{t.kriptoSignedBadge}</Badge>
				</div>
			</CardHeader>

			<CardContent className='grid gap-6 lg:grid-cols-[280px_1fr]'>
				{artifact.qrSvg && (
					<div className='flex justify-center lg:justify-start'>
						<div className='rounded-lg border bg-background p-3 shadow-sm'>
							<img
								alt={t.kriptoTitle}
								className='h-56 w-56 object-contain'
								src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(artifact.qrSvg)}`}
							/>
						</div>
					</div>
				)}

				<div className='flex flex-col gap-4'>
					<div className='grid gap-3 md:grid-cols-2'>
						<KriptoInfoItem label={t.signerLabel} value={artifact.signerName || t.empty} />
						<KriptoInfoItem label={t.signedAtLabel} value={signedAt} />
						<KriptoInfoItem label={t.signatureIdLabel} value={artifact.signatureId || t.empty} />
					</div>

					<Separator />

					<div className='grid gap-3 md:grid-cols-2'>
						<KriptoInfoItem label={t.documentIdLabel} value={artifact.documentId || t.empty} />
						<KriptoInfoItem label={t.documentVersionLabel} value={artifact.documentVersion || t.empty} />
						<KriptoInfoItem label={t.documentHashLabel} value={documentHash || t.empty} />
						<KriptoInfoItem label={t.verificationUrlLabel} value={artifact.verificationUrl || t.empty} />
					</div>
				</div>
			</CardContent>

			<CardFooter className='justify-end'>
				<Button asChild disabled={!artifact.verificationUrl}>
					<a href={artifact.verificationUrl || undefined} rel='noreferrer' target='_blank'>
						<ExternalLink data-icon='inline-start' />
						{t.openVerification}
					</a>
				</Button>
			</CardFooter>
		</Card>
	)
})

KriptoSignatureCard.displayName = 'KriptoSignatureCard'

const KriptoInfoItem = ({ label, value }: { label: string; value: string }) => (
	<div className='flex min-w-0 flex-col gap-1'>
		<div className='text-sm text-muted-foreground'>{label}</div>
		<div className='break-words text-sm font-medium'>{value}</div>
	</div>
)
