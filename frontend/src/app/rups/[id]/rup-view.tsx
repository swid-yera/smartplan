import { type FC, type ReactNode, useEffect, useState } from 'react'

import { PageTitle, ResponsibleUsersCard, StatusBadge } from '@components'
import {
	createKriptoApprovalProof,
	extractKriptoApprovalMetadata,
	formatHours,
	getLocaleText,
	getUILocaleSection,
	hasRole,
	normalizeStudyForm,
	parseKriptoFileText,
} from '@helpers'
import { services } from '@services'
import {
	Button,
	ButtonGroup,
	Checkbox,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Tabs,
	TabsList,
	TabsTrigger,
	Textarea,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IRup, type Locale, RoleEnum, StatusEnum } from '@types'
import { CheckCircle, Search, SendToBack, ShieldAlert, Timer } from 'lucide-react'
import { toast } from 'sonner'

import { ContactsView, DisciplineView, ExplorationView, TopicsView } from '../components'
import { BasicView } from '../components/view/basic-view'
import localeDictionary from './locale.json'

interface IRupViewProps {
	data: IRup
	role: RoleEnum
	onStatusChange: (
		newStatus: StatusEnum,
		options?: { reason?: string; keyId?: string; userId?: string; publicKey?: string; challenge?: string; signature?: string },
	) => void
	actions?: ReactNode
}

export const RupView: FC<IRupViewProps> = ({ data, role, onStatusChange, actions }) => {
	const locale = useLocaleStore((state) => state.locale)
	const localeText = getUILocaleSection(localeDictionary, locale)
	const t = localeText.view
	const [activeLocale, setActiveLocale] = useState<Locale>(locale)
	const [generalComment, setGeneralComment] = useState('')
	const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false)
	const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false)
	const [keyId, setKeyId] = useState('')
	const [userId, setUserId] = useState('')
	const [kriptoFileText, setKriptoFileText] = useState('')
	const [kriptoPassword, setKriptoPassword] = useState('')
	const [fileName, setFileName] = useState('')
	const [checked, setChecked] = useState(false)
	const isMethodistReview = hasRole(role, RoleEnum.METHODIST, true) && data.status === StatusEnum.IN_REVIEW

	useEffect(() => {
		setActiveLocale(locale)
	}, [locale])

	const onApproveFileUpload = async (file?: File) => {
		if (!file) return
		if (!file.name.toLowerCase().endsWith('.kripto')) {
			toast.error(localeText.toasts.kriptoOnlyV3)
			return
		}

		const content = await file.text()
		const parsed = parseKriptoFileText(content)
		const metadata = extractKriptoApprovalMetadata(parsed)

		setKeyId(metadata.keyId)
		setUserId(metadata.userId)
		setKriptoFileText(content)
		setFileName(file.name)
		toast.success(localeText.toasts.kriptoParsed)
	}

	return (
		<div className='w-full mx-auto relative'>
			<PageTitle
				sticky
				actions={
					<div className='flex items-center gap-2'>
						<Tabs value={activeLocale} onValueChange={(next) => setActiveLocale(next as Locale)}>
							<TabsList>
								<TabsTrigger value='ru'>{t.languageRu}</TabsTrigger>
								<TabsTrigger value='kk'>{t.languageKk}</TabsTrigger>
							</TabsList>
						</Tabs>
						<ButtonGroup>
							{actions}
							{isMethodistReview && (
								<ButtonGroup>
									<Button
										className='hover:text-destructive'
										size='sm'
										variant='outline'
										onClick={() => setIsRejectSheetOpen(true)}
									>
										<SendToBack className='mr-2 h-4 w-4' />
										{t.reject}
									</Button>

									<Button
										className='hover:text-primary'
										size='sm'
										variant='outline'
										onClick={() => setIsApproveSheetOpen(true)}
									>
										<CheckCircle className='mr-2 h-4 w-4' />
										{t.approve}
									</Button>
								</ButtonGroup>
							)}
						</ButtonGroup>
					</div>
				}
				backHref='/rups'
				description={
					hasRole(role, RoleEnum.METHODIST) ? t.reviewDescription : t.readOnlyDescription
				}
			>
				{` ${getLocaleText(data.name, activeLocale) || `${t.titleFallback} `} `}
				<StatusBadge status={data.status} />
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
								value: formatHours(data.totalHours),
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
						methodist={data.methodist}
						teacher={data.teacher}
						updatedAt={data.updatedAt}
					/>
				</div>

				<ExplorationView activeLocale={activeLocale} data={data} />

				<ContactsView contacts={data.contacts} creatorId={data.teacher.keycloakId} />

				<DisciplineView activeLocale={activeLocale} disciplines={data.disciplines} rupName={data.name} />

				<TopicsView
					activeLocale={activeLocale}
					disciplines={data.disciplines}
					rupId={data.id}
					rupStatus={data.status}
					type={data.type}
				/>
			</div>

			<Sheet open={isRejectSheetOpen} onOpenChange={setIsRejectSheetOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>{t.rejectSheetTitle}</SheetTitle>
						<SheetDescription>{t.rejectSheetDescription}</SheetDescription>
					</SheetHeader>
					<div className='px-4 grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='reject-reason'>{t.rejectReasonLabel}</Label>
							<Textarea
								id='reject-reason'
								placeholder={t.rejectReasonPlaceholder}
								rows={12}
								value={generalComment}
								onChange={(e) => setGeneralComment(e.target.value)}
							/>
						</div>
					</div>
					<SheetFooter>
						<Button variant='outline' onClick={() => setIsRejectSheetOpen(false)}>
							{t.cancel}
						</Button>
						<Button
							disabled={!generalComment}
							variant='destructive'
							onClick={() => {
								if (!generalComment.trim()) {
									toast.error(t.rejectReasonRequired)
									return
								}
								onStatusChange(StatusEnum.REJECTED, { reason: generalComment })
								setIsRejectSheetOpen(false)
							}}
						>
							{t.rejectConfirm}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<Sheet open={isApproveSheetOpen} onOpenChange={setIsApproveSheetOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>{t.approveSheetTitle}</SheetTitle>
						<SheetDescription>{t.approveSheetDescription}</SheetDescription>
					</SheetHeader>
					<div className='px-4 grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='approve-kripto-file'>{t.approveFileLabel}</Label>
							<Input
								accept='.kripto,application/json'
								id='approve-kripto-file'
								type='file'
								onChange={(e) => {
									const file = e.target.files?.[0]
									onApproveFileUpload(file).catch((err) => {
										toast.error(err.message || localeText.toasts.kriptoReadError)
									})
								}}
							/>
							{fileName && (
								<p className='text-xs text-muted-foreground'>
									{t.fileLabel}: {fileName}
								</p>
							)}
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='approve-key-id'>{t.approveKeyIdLabel}</Label>
							<Input
								id='approve-key-id'
								placeholder={t.approveKeyIdPlaceholder}
								readOnly
								value={keyId}
							/>
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='approve-kripto-password'>{t.approvePasswordLabel}</Label>
							<Input
								id='approve-kripto-password'
								type='password'
								value={kriptoPassword}
								onChange={(e) => setKriptoPassword(e.target.value)}
							/>
						</div>

						<label className='flex items-center gap-2 text-sm'>
							<Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
							<span>{t.approveCheckbox}</span>
						</label>
					</div>
					<SheetFooter>
						<Button variant='outline' onClick={() => setIsApproveSheetOpen(false)}>
							{t.cancel}
						</Button>
						<Button
							onClick={async () => {
								if (!kriptoFileText || !keyId.trim() || !userId.trim()) {
									toast.error(localeText.toasts.kriptoUploadRequired)
									return
								}
								if (!kriptoPassword) {
									toast.error(localeText.toasts.kriptoPasswordRequired)
									return
								}
								if (!checked) {
									toast.error(localeText.toasts.kriptoCheckConfirm)
									return
								}

								try {
									const { challenge } = await services.rup.createApproveChallenge(data.id, {
										key_id: keyId,
										user_id: userId,
									})
									const proof = await createKriptoApprovalProof(kriptoFileText, kriptoPassword, challenge)
									onStatusChange(StatusEnum.APPROVED, {
										keyId: proof.keyId,
										userId: proof.userId,
										publicKey: proof.publicKey,
										challenge: proof.challenge,
										signature: proof.signature,
									})
									setIsApproveSheetOpen(false)
									setKeyId('')
									setUserId('')
									setKriptoFileText('')
									setKriptoPassword('')
									setFileName('')
									setChecked(false)
								} catch (err) {
									toast.error(err instanceof Error ? err.message : localeText.toasts.kriptoVerifyError)
								}
							}}
						>
							{t.approveConfirm}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	)
}
