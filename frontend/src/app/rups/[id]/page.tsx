'use client'

import { type FC, useEffect, useState } from 'react'

import { notFound, useParams, useRouter } from 'next/navigation'

import { Loader, RupLanguageDialog, withPermission } from '@components'
import {
	extractKriptoApprovalMetadata,
	getLocaleText,
	getUILocaleSection,
	hasAnyPermission,
	hasLocaleTextForLocale,
	hasPermission,
	interpolateUILocaleText,
	isAuthor,
	normalizeStatus,
	parseKriptoFileText,
	toBackendLocale,
} from '@helpers'
import { services } from '@services'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	CardContent,
	Checkbox,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	type IKriptoKeyPayload,
	type IRup,
	type IUpdateStatusRequest,
	type Locale,
	PermissionCodeEnum,
	StatusEnum,
} from '@types'
import { Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { trackLanguageGeneration } from '../language-generation-tracker'
import localeDictionary from './locale.json'
import { RupView } from './rup-view'

type IRupIdLocaleText = typeof localeDictionary.ru

const getOppositeLocale = (locale: Locale): Locale => (locale === 'kk' ? 'ru' : 'kk')

const hasRupContentForLocale = (rup: IRup, locale: Locale): boolean => {
	const coreFields = [
		rup.name,
		rup.explorationNote.basis,
		rup.explorationNote.goals,
		rup.explorationNote.competencies,
		rup.explorationNote.prerequisites,
		rup.explorationNote.postrequisites,
	]

	if (coreFields.some((field) => hasLocaleTextForLocale(field, locale))) {
		return true
	}

	for (const resource of rup.explorationNote.internetResources) {
		if (hasLocaleTextForLocale(resource.name, locale)) {
			return true
		}
	}

	for (const resource of rup.explorationNote.technicalResources) {
		if (hasLocaleTextForLocale(resource.name, locale)) {
			return true
		}
	}

	for (const discipline of rup.disciplines) {
		if (hasLocaleTextForLocale(discipline.name, locale)) {
			return true
		}

		for (const topic of discipline.topics) {
			if (hasLocaleTextForLocale(topic.name, locale)) {
				return true
			}
		}
	}

	return false
}

const Page: FC = () => {
	const { push, replace, back } = useRouter()
	const params = useParams<{ id: string }>()
	const rupId = params.id ?? ''

	const { authLoading, user } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const queryClient = useQueryClient()

	const [activeLocale, setActiveLocale] = useState<Locale>(locale)
	const [isDownloadLanguageDialogOpen, setIsDownloadLanguageDialogOpen] = useState(false)
	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)

	// queries
	const { data: rupData, isLoading } = useQuery({ ...services.rup.getByIdOptions(rupId), enabled: !!rupId })
	const { data: signatureArtifact, isLoading: isSignatureArtifactLoading } = useQuery({
		...services.rup.getSignatureArtifactOptions(rupId),
		enabled: !!rupId && rupData?.status === StatusEnum.APPROVED,
	})
	const { data: generationStatus, isLoading: isGenerationStatusLoading } = useQuery({
		...services.rup.getLanguageGenerationStatusOptions(rupId),
		enabled: !!rupId,
	})
	// mutations
	const updateStatusMutation = useMutation(services.rup.updateStatusOptions())
	const regenerateLanguageMutation = useMutation(services.rup.regenerateLanguageGenerationOptions())
	const deleteMutation = useMutation(services.rup.deleteMutationOptions())
	const isLanguageGenerationInProgress =
		generationStatus?.status === 'queued' || generationStatus?.status === 'running'

	useEffect(() => {
		if (!isLanguageGenerationInProgress) return
		replace(`/rups/${rupId}/language-generation`)
	}, [isLanguageGenerationInProgress, replace, rupId])

	useEffect(() => {
		setActiveLocale(locale)
	}, [locale])

	// change rup status
	const handleStatusChange = (
		newStatus: StatusEnum,
		options?: {
			reason?: string
			keyId?: string
			userId?: string
			password?: string
			confirmed?: boolean
			kripto?: IKriptoKeyPayload
		},
	) => {
		if (!rupData) return
		setIsSheetOpen(false)

		const toastId = `rup-${rupData.id}-status-update-${newStatus}`

		toast.loading(t.toasts.statusLoading, { id: toastId })
		const updateStatusPayload: IUpdateStatusRequest = {
			id: rupData.id,
			status: newStatus,
			reason: options?.reason,
			key_id: options?.keyId,
			user_id: options?.userId,
			password: options?.password,
			confirmed: options?.confirmed,
			kripto: options?.kripto,
		}

		updateStatusMutation.mutate(updateStatusPayload, {
			onSuccess: () => {
				toast.success(t.toasts.statusSuccess, { id: toastId })
			},
			onError: (err) => {
				toast.error(t.toasts.statusError, { id: toastId, description: err.message })
			},
		})
	}

	// delete rup
	const handleDeleteRup = () => {
		if (!rupData) return
		setIsDeleteDialogOpen(false)

		const toastId = `rup-${rupData.id}-delete`
		const rupName = getLocaleText(rupData.name, locale) || t.view.titleFallback

		toast.loading(interpolateUILocaleText(t.toasts.deleteLoading, { name: rupName }), { id: toastId })

		deleteMutation.mutate(rupData.id, {
			onSuccess: () => {
				toast.success(interpolateUILocaleText(t.toasts.deleteSuccess, { name: rupName }), { id: toastId })
				back()
			},
			onError: (err) => {
				toast.error(interpolateUILocaleText(t.toasts.deleteError, { name: rupName }), {
					id: toastId,
					description: err.message,
				})
			},
		})
	}

	const onDownload = (downloadLanguage: Locale) => {
		if (!rupData) return

		setIsDownloadLanguageDialogOpen(false)

		toast.promise(
			async () => {
				const data = await queryClient.fetchQuery(
					services.rup.getDownloadUrlOptions(rupId, toBackendLocale(downloadLanguage)),
				)

				if (!data) throw new Error(t.toasts.downloadLinkError)

				const link = document.createElement('a')

				link.href = data.url
				link.setAttribute('download', `RUP_${getLocaleText(rupData.name, downloadLanguage) || 'file'}.docx`)
				document.body.appendChild(link)
				link.click()
				link.remove()
			},
			{
				loading: t.toasts.downloadFilePreparing,
				success: t.toasts.downloadFileSuccess,
				error: t.toasts.downloadFileError,
			},
		)
	}

	const handleRegenerateLanguage = (sourceLanguage: Locale) => {
		if (!rupData) return
		setIsRegenerateDialogOpen(false)

		const toastId = `rup-${rupData.id}-regenerate-language`

		toast.loading(t.toasts.regenerateLoading, { id: toastId })
		regenerateLanguageMutation.mutate(
			{
				id: rupData.id,
				sourceLanguage: toBackendLocale(sourceLanguage),
			},
			{
				onSuccess: () => {
					trackLanguageGeneration(rupData.id)
					toast.success(t.toasts.regenerateSuccess, { id: toastId })
					replace(`/rups/${rupData.id}/language-generation`)
				},
				onError: (err) => {
					toast.error(t.toasts.regenerateError, {
						id: toastId,
						description: err.message,
					})
				},
			},
		)
	}

	// loading
	if (
		authLoading ||
		isLoading ||
		isGenerationStatusLoading ||
		isSignatureArtifactLoading ||
		isLanguageGenerationInProgress
	)
		return <Loader />
	if (!user || !rupData) return notFound()

	// bools
	const canFullAccess = hasPermission(user, PermissionCodeEnum.RUP_FULL)
	const canManageRups = hasAnyPermission(user, [PermissionCodeEnum.RUP_MANAGE])
	const isStatusForEdit = rupData.status === StatusEnum.DRAFT || rupData.status === StatusEnum.REJECTED
	const isRupCreator = isAuthor(user, rupData.teacher.keycloakId)
	const isRupDeveloper = isRupCreator || rupData.contacts.some((contact) => contact.keycloakId === user.keycloakId)
	const canRegenerateLanguage = rupData.status === StatusEnum.DRAFT && (isRupDeveloper || canFullAccess)
	const canDownload = rupData.status === StatusEnum.APPROVED
	const canEdit = (isRupDeveloper || canFullAccess) && isStatusForEdit
	const canDelete = (isRupCreator || canFullAccess) && isStatusForEdit
	const canSendToReview = (isRupDeveloper || canFullAccess) && isStatusForEdit
	const isActiveLocaleMissing = !hasRupContentForLocale(rupData, activeLocale)
	const retrySourceLocale = getOppositeLocale(activeLocale)
	const selectedLanguageLabel = activeLocale === 'kk' ? t.view.languageKk : t.view.languageRu
	const sourceLanguageLabel = retrySourceLocale === 'kk' ? t.view.languageKk : t.view.languageRu

	return (
		<>
			<RupView
				activeLocale={activeLocale}
				canDelete={canDelete}
				canDownload={canDownload}
				canEdit={canEdit}
				canFullAccess={canFullAccess}
				canManage={canManageRups || canFullAccess}
				canRegenerateLanguage={canRegenerateLanguage}
				canSendToReview={canSendToReview}
				data={rupData}
				isDeletePending={deleteMutation.isPending}
				isRegeneratePending={regenerateLanguageMutation.isPending}
				kriptoArtifact={signatureArtifact ?? undefined}
				localeNotice={
					isActiveLocaleMissing ? (
						<Card>
							<CardContent className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
								<div className='space-y-1'>
									<div className='font-semibold'>{t.view.missingLocaleTitle}</div>
									<div className='text-sm'>
										{interpolateUILocaleText(t.view.missingLocaleDescription, {
											language: selectedLanguageLabel,
											sourceLanguage: sourceLanguageLabel,
										})}
									</div>
								</div>
								{canRegenerateLanguage && (
									<Button
										className='shrink-0'
										disabled={regenerateLanguageMutation.isPending}
										onClick={() => handleRegenerateLanguage(retrySourceLocale)}
									>
										{regenerateLanguageMutation.isPending ? (
											<>
												<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												{t.view.retryingMissingLocale}
											</>
										) : (
											<>
												<RotateCcw className='mr-2 h-4 w-4' />
												{t.view.retryMissingLocale}
											</>
										)}
									</Button>
								)}
							</CardContent>
						</Card>
					) : null
				}
				onActiveLocaleChange={setActiveLocale}
				onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
				onOpenDownloadDialog={() => setIsDownloadLanguageDialogOpen(true)}
				onOpenRegenerateDialog={() => setIsRegenerateDialogOpen(true)}
				onOpenStatusSheet={() => setIsSheetOpen(true)}
				onSendToReview={() => handleStatusChange(StatusEnum.IN_REVIEW)}
				onStatusChange={handleStatusChange}
			/>

			<StatusChangeSheet
				handleStatusChange={handleStatusChange}
				isSheetOpen={isSheetOpen}
				setIsSheetOpen={setIsSheetOpen}
				text={t}
			/>

			<DeleteAlert
				isDeleteDialogOpen={isDeleteDialogOpen}
				setIsDeleteDialogOpen={setIsDeleteDialogOpen}
				text={t}
				onDelete={handleDeleteRup}
			/>

			{rupData.status === StatusEnum.APPROVED && (
				<RupLanguageDialog
					confirmLabel={t.actions.download}
					currentLanguage={activeLocale}
					description={t.downloadLanguageDialog.description}
					languageLabels={{ kk: t.view.languageKk, ru: t.view.languageRu }}
					open={isDownloadLanguageDialogOpen}
					title={t.downloadLanguageDialog.title}
					onConfirm={onDownload}
					onOpenChange={setIsDownloadLanguageDialogOpen}
				/>
			)}

			{(rupData.status === StatusEnum.DRAFT || rupData.status === StatusEnum.REJECTED) && (
				<RupLanguageDialog
					confirmLabel={t.languageDialog.confirm}
					currentLanguage={activeLocale}
					description={t.languageDialog.description}
					languageLabels={{ kk: t.view.languageKk, ru: t.view.languageRu }}
					open={isRegenerateDialogOpen}
					title={t.languageDialog.title}
					onConfirm={handleRegenerateLanguage}
					onOpenChange={setIsRegenerateDialogOpen}
				/>
			)}
		</>
	)
}

export default withPermission(Page, [
	PermissionCodeEnum.RUP_FULL,
	PermissionCodeEnum.RUP_MANAGE,
	PermissionCodeEnum.RUP_VIEW,
])

interface IStatusChangeSheetProps {
	isSheetOpen: boolean
	setIsSheetOpen: (state: boolean) => void
	handleStatusChange: (
		newStatus: StatusEnum,
		options?: { reason?: string; keyId?: string; userId?: string; password?: string; confirmed?: boolean },
	) => void
	text: IRupIdLocaleText
}

const StatusChangeSheet: FC<IStatusChangeSheetProps> = ({ isSheetOpen, setIsSheetOpen, handleStatusChange, text }) => {
	const [newStatus, setNewStatus] = useState<StatusEnum | undefined>(undefined)
	const [reason, setReason] = useState('')
	const [keyId, setKeyId] = useState('')
	const [userId, setUserId] = useState('')
	const [fileName, setFileName] = useState('')
	const [password, setPassword] = useState('')
	const [confirmed, setConfirmed] = useState(false)

	const isApprove = newStatus === StatusEnum.APPROVED

	const onFileUpload = async (file?: File) => {
		if (!file) return
		if (!file.name.toLowerCase().endsWith('.kripto')) {
			toast.error(text.toasts.kriptoOnlyV3)

			return
		}

		const content = await file.text()
		const parsed = parseKriptoFileText(content)
		const metadata = extractKriptoApprovalMetadata(parsed)

		setKeyId(metadata.keyId)
		setUserId(metadata.userId)
		setFileName(file.name)
		toast.success(text.toasts.kriptoParsed)
	}

	const onSheetSubmit = () => {
		if (newStatus) {
			if (isApprove) {
				if (!fileName || !keyId || !userId) {
					toast.error(text.toasts.kriptoUploadRequired)

					return
				}
				if (!password) {
					toast.error(text.toasts.kriptoPasswordRequired)

					return
				}
				handleStatusChange(newStatus, {
					reason,
					keyId,
					userId,
					password,
					confirmed,
				})
			} else {
				handleStatusChange(newStatus, { reason })
			}

			setNewStatus(undefined)
			setReason('')
			setKeyId('')
			setUserId('')
			setFileName('')
			setPassword('')
			setConfirmed(false)
		}
	}

	return (
		<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{text.statusSheet.title}</SheetTitle>
					<SheetDescription>{text.statusSheet.description}</SheetDescription>
				</SheetHeader>
				<div className='grid flex-1 auto-rows-min gap-6 p-4'>
					<div className='grid gap-2'>
						<Label htmlFor='status'>{text.statusSheet.statusLabel}</Label>
						<Select value={newStatus} onValueChange={(val) => setNewStatus(val as StatusEnum)}>
							<SelectTrigger className='w-full' id='status'>
								<SelectValue placeholder={text.statusSheet.statusPlaceholder} />
							</SelectTrigger>
							<SelectContent>
								{Object.values(StatusEnum).map((status) => (
									<SelectItem key={status} value={status}>
										{normalizeStatus(status)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='reason'>{text.statusSheet.reasonLabel}</Label>
						<Textarea
							id='reason'
							placeholder={text.statusSheet.reasonPlaceholder}
							rows={7}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>
					</div>

					{isApprove && (
						<div className='grid gap-4 rounded-md border p-3'>
							<div className='grid gap-2'>
								<Label htmlFor='kripto-file'>{text.statusSheet.kriptoFileLabel}</Label>
								<Input
									accept='.kripto,application/json'
									id='kripto-file'
									type='file'
									onChange={(e) => {
										const file = e.target.files?.[0]

										onFileUpload(file).catch((err) => {
											toast.error(err.message || text.toasts.kriptoReadError)
										})
									}}
								/>
								{fileName && (
									<p className='text-xs text-muted-foreground'>
										{text.statusSheet.fileLabel}: {fileName}
									</p>
								)}
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='key-id'>{text.statusSheet.keyIdLabel}</Label>
								<Input readOnly id='key-id' placeholder={text.statusSheet.keyIdPlaceholder} value={keyId} />
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='password'>{text.statusSheet.passwordLabel}</Label>
								<Input
									id='password'
									placeholder={text.statusSheet.passwordLabel}
									type='password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>

							<div className='grid gap-2'>
								<div className='flex items-center space-x-2'>
									<Checkbox
										checked={confirmed}
										id='confirm'
										onCheckedChange={(checked) => setConfirmed(!!checked)}
									/>
									<Label className='cursor-pointer' htmlFor='confirm'>
										{text.statusSheet.confirmCheck}
									</Label>
								</div>
							</div>
						</div>
					)}
				</div>
				<SheetFooter>
					<Button disabled={!newStatus || (isApprove && (!confirmed || !password))} onClick={onSheetSubmit}>
						{text.statusSheet.save}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

// delete alert
interface IDeleteAlert {
	isDeleteDialogOpen: boolean
	setIsDeleteDialogOpen: (state: boolean) => void
	onDelete: () => void
	text: IRupIdLocaleText
}

const DeleteAlert: FC<IDeleteAlert> = ({ isDeleteDialogOpen, setIsDeleteDialogOpen, onDelete, text }) => {
	return (
		<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{text.deleteDialog.title}</AlertDialogTitle>
					<AlertDialogDescription>{text.deleteDialog.description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{text.deleteDialog.cancel}</AlertDialogCancel>
					<AlertDialogAction variant='destructive' onClick={onDelete}>
						{text.deleteDialog.delete}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
