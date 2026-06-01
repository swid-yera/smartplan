'use client'

import { type FC, useEffect, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { Loader } from '@components'
import {
	extractKriptoApprovalMetadata,
	getLocaleText,
	getUILocaleSection,
	hasRole,
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
	ButtonGroup,
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
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateStatusRequest, type Locale, RoleEnum, StatusEnum } from '@types'
import { Edit, FileDown, RotateCcw, SendIcon, ShieldAlert, Trash } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'
import { trackLanguageGeneration } from '../language-generation-tracker'
import { RupView } from './rup-view'

type IRupIdLocaleText = typeof localeDictionary.ru

const Page: FC = () => {
	const { replace } = useRouter()
	const params = useParams<{ id: string }>()

	const { authLoading, user } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const [activeLocale, setActiveLocale] = useState<Locale>(locale)
	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	// queries
	const { data: rupData, isLoading } = useQuery({ ...services.rup.getByIdOptions(params.id), enabled: !!params.id })
	const { data: generationStatus, isLoading: isGenerationStatusLoading } = useQuery({
		...services.rup.getLanguageGenerationStatusOptions(params.id),
		enabled: !!params.id,
	})
	const { refetch: getDownloadUrl } = useQuery({
		...services.rup.getDownloadUrlOptions(params.id, toBackendLocale(activeLocale)),
		enabled: false,
	})
	// mutations
	const updateStatusMutation = useMutation(services.rup.updateStatusOptions())
	const regenerateLanguageMutation = useMutation(services.rup.regenerateLanguageGenerationOptions())
	const deleteMutation = useMutation(services.rup.deleteMutationOptions())
	const isLanguageGenerationInProgress =
		generationStatus?.status === 'queued' || generationStatus?.status === 'running'

	useEffect(() => {
		if (!isLanguageGenerationInProgress) return
		replace(`/rups/${params.id}/language-generation`)
	}, [isLanguageGenerationInProgress, params.id, replace])

	useEffect(() => {
		setActiveLocale(locale)
	}, [locale])

// change rup status
  const handleStatusChange = (
    newStatus: StatusEnum,
    options?: { reason?: string; keyId?: string; userId?: string; password?: string; confirmed?: boolean },
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
				replace('/rups')
			},
			onError: (err) => {
				toast.error(interpolateUILocaleText(t.toasts.deleteError, { name: rupName }), {
					id: toastId,
					description: err.message,
				})
			},
		})
	}

	const onDownload = () => {
		toast.promise(
			async () => {
				const { data } = await getDownloadUrl()

				if (!data) throw new Error(t.toasts.downloadLinkError)

				const link = document.createElement('a')

				link.href = data.url
				link.setAttribute('download', `RUP_${getLocaleText(rupData?.name, activeLocale) || 'file'}.docx`)
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

	const handleRegenerateLanguage = () => {
		if (!rupData) return

		const toastId = `rup-${rupData.id}-regenerate-language`

		toast.loading(t.toasts.regenerateLoading, { id: toastId })
		regenerateLanguageMutation.mutate(
			{
				id: rupData.id,
				sourceLanguage: toBackendLocale(activeLocale),
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
	if (authLoading || isLoading || isGenerationStatusLoading || isLanguageGenerationInProgress) return <Loader />
	if (!user || !rupData) return notFound()

	// bools
	const isAdmin = hasRole(user.role, RoleEnum.ADMIN)
	const isStatusForEdit = rupData.status === StatusEnum.DRAFT || rupData.status === StatusEnum.REJECTED
	const isRupCreator = isAuthor(user, rupData.teacher.keycloakId)
	const isRupDeveloper = isRupCreator || rupData.contacts.some((contact) => contact.keycloakId === user.keycloakId)
	const canRegenerateLanguage = rupData.status === StatusEnum.DRAFT && (isRupDeveloper || isAdmin)
	// conditions
	const canDownload = rupData.status === StatusEnum.APPROVED

	return (
		<>
			<RupView
				activeLocale={activeLocale}
				actions={
					<ButtonGroup>
						{isAdmin && (
							<Button
								className='hover:text-primary'
								size='sm'
								variant='outline'
								onClick={() => setIsSheetOpen(true)}
							>
								<ShieldAlert />
								{t.actions.changeStatus}
							</Button>
						)}
						{isRupCreator && isStatusForEdit && (
							<Button
								className='hover:text-destructive'
								size='sm'
								variant='outline'
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								<Trash />
								{t.actions.delete}
							</Button>
						)}
						{isRupDeveloper && isStatusForEdit && (
							<Button asChild size='sm' variant='outline'>
								<Link href={`/rups/${params.id}/edit`}>
									<Edit /> {t.actions.edit}
								</Link>
							</Button>
						)}
						{canRegenerateLanguage && (
							<Button
								className='hover:text-primary'
								size='sm'
								variant='outline'
								onClick={handleRegenerateLanguage}
							>
								<RotateCcw />
								{t.actions.regenerate}
							</Button>
						)}
						{canDownload && (
							<Button className='hover:text-primary' size='sm' variant='outline' onClick={onDownload}>
								<FileDown className='mr-2 h-4 w-4' />
								{t.actions.download}
							</Button>
						)}
						{isRupDeveloper && isStatusForEdit && (
							<Button
								className='hover:text-primary'
								size='sm'
								variant='outline'
								onClick={() => handleStatusChange(StatusEnum.IN_REVIEW)}
							>
								<SendIcon />
								{t.actions.sendToReview}
							</Button>
						)}
					</ButtonGroup>
				}
				data={rupData}
				onActiveLocaleChange={setActiveLocale}
				role={user.role}
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
				onDelete={handleDeleteRup}
				text={t}
			/>
		</>
	)
}

export default Page

interface IStatusChangeSheetProps {
	isSheetOpen: boolean
	setIsSheetOpen: (state: boolean) => void
	handleStatusChange: (
		newStatus: StatusEnum,
		options?: { reason?: string; keyId?: string; userId?: string; password?: string; confirmed?: boolean },
	) => void
	text: IRupIdLocaleText
}

const StatusChangeSheet: FC<IStatusChangeSheetProps> = ({
	isSheetOpen,
	setIsSheetOpen,
	handleStatusChange,
	text,
}) => {
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
								<Input
									id='key-id'
									placeholder={text.statusSheet.keyIdPlaceholder}
									readOnly
									value={keyId}
								/>
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='password'>{text.statusSheet.passwordLabel}</Label>
								<Input
									id='password'
									type='password'
									placeholder={text.statusSheet.passwordLabel}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>

							<div className='grid gap-2'>
								<div className='flex items-center space-x-2'>
									<Checkbox
										id='confirm'
										checked={confirmed}
										onCheckedChange={(checked) => setConfirmed(!!checked)}
									/>
									<Label htmlFor='confirm' className='cursor-pointer'>
										{text.statusSheet.confirmCheck}
									</Label>
								</div>
							</div>
						</div>
					)}
				</div>
				<SheetFooter>
					<Button 
						disabled={!newStatus || (isApprove && (!confirmed || !password))} 
						onClick={onSheetSubmit}
					>
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
