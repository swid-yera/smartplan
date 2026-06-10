'use client'

import { memo, useRef, useState } from 'react'

import { extractKriptoApprovalMetadata, parseKriptoFileText } from '@helpers'
import {
	Button,
	Checkbox,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from '@shadcn'
import { type IRup, StatusEnum } from '@types'
import { CheckCircle, Eye, EyeOff, SendToBack } from 'lucide-react'
import { toast } from 'sonner'

interface IRupReviewSheetsProps {
	data: IRup
	canManage: boolean
	text: {
		view: {
			reject: string
			approve: string
			rejectSheetTitle: string
			rejectSheetDescription: string
			rejectReasonLabel: string
			rejectReasonPlaceholder: string
			cancel: string
			rejectReasonRequired: string
			rejectConfirm: string
			approveSheetTitle: string
			approveSheetDescription: string
			approveFileLabel: string
			chooseFile: string
			fileLabel: string
			approveKeyIdLabel: string
			approveKeyIdPlaceholder: string
			approvePasswordLabel: string
			showPassword: string
			hidePassword: string
			approveCheckbox: string
			approveConfirm: string
		}
		toasts: {
			kriptoOnlyV3: string
			kriptoParsed: string
			kriptoReadError: string
			kriptoUploadRequired: string
			kriptoPasswordRequired: string
		}
	}
	onStatusChange: (
		newStatus: StatusEnum,
		options?: { reason?: string; keyId?: string; userId?: string; password?: string; confirmed?: boolean },
	) => void
}

export const RupReviewSheets = memo(function RupReviewSheets({
	data,
	canManage,
	text,
	onStatusChange,
}: IRupReviewSheetsProps) {
	const t = text.view
	const [generalComment, setGeneralComment] = useState('')
	const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false)
	const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false)
	const [keyId, setKeyId] = useState('')
	const [userId, setUserId] = useState('')
	const [fileName, setFileName] = useState('')
	const [approvePassword, setApprovePassword] = useState('')
	const [approveConfirmed, setApproveConfirmed] = useState(false)
	const [showApprovePassword, setShowApprovePassword] = useState(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const isMethodistReview = canManage && data.status === StatusEnum.IN_REVIEW

	const onApproveFileUpload = async (file?: File) => {
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

	if (!isMethodistReview) return null

	return (
		<>
			<div className='flex items-center gap-2'>
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
			</div>

			{isRejectSheetOpen && (
				<Sheet open={isRejectSheetOpen} onOpenChange={setIsRejectSheetOpen}>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>{t.rejectSheetTitle}</SheetTitle>
							<SheetDescription>{t.rejectSheetDescription}</SheetDescription>
						</SheetHeader>
						<div className='grid gap-4 px-4 py-4'>
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
									setGeneralComment('')
								}}
							>
								{t.rejectConfirm}
							</Button>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			)}

			{isApproveSheetOpen && (
				<Sheet open={isApproveSheetOpen} onOpenChange={setIsApproveSheetOpen}>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>{t.approveSheetTitle}</SheetTitle>
							<SheetDescription>{t.approveSheetDescription}</SheetDescription>
						</SheetHeader>
						<div className='grid gap-4 px-4 py-4'>
							<div className='grid gap-2'>
								<Label htmlFor='approve-kripto-file'>{t.approveFileLabel}</Label>
								<div className='flex items-center gap-2'>
									<Input
										ref={fileInputRef}
										accept='.kripto,application/json'
										className='hidden'
										id='approve-kripto-file'
										type='file'
										onChange={(e) => {
											const file = e.target.files?.[0]

											onApproveFileUpload(file).catch((err) => {
												toast.error(err.message || text.toasts.kriptoReadError)
											})
										}}
									/>
									<Button
										className='shrink-0'
										type='button'
										variant='outline'
										onClick={() => fileInputRef.current?.click()}
									>
										{t.chooseFile}
									</Button>
								</div>
								{fileName && (
									<p className='text-xs text-muted-foreground'>
										{t.fileLabel}: {fileName}
									</p>
								)}
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='approve-key-id'>{t.approveKeyIdLabel}</Label>
								<Input readOnly id='approve-key-id' placeholder={t.approveKeyIdPlaceholder} value={keyId} />
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='approve-password'>{t.approvePasswordLabel}</Label>
								<div className='relative'>
									<Input
										className='pr-10'
										id='approve-password'
										placeholder={t.approvePasswordLabel}
										type={showApprovePassword ? 'text' : 'password'}
										value={approvePassword}
										onChange={(e) => setApprovePassword(e.target.value)}
									/>
									<Button
										aria-label={showApprovePassword ? t.hidePassword : t.showPassword}
										className='absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0'
										type='button'
										variant='ghost'
										onClick={() => setShowApprovePassword((current) => !current)}
									>
										{showApprovePassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
									</Button>
								</div>
							</div>

							<div className='grid gap-2'>
								<div className='flex items-center space-x-2'>
									<Checkbox
										checked={approveConfirmed}
										id='approve-confirm'
										onCheckedChange={(checked) => setApproveConfirmed(!!checked)}
									/>
									<Label className='cursor-pointer' htmlFor='approve-confirm'>
										{t.approveCheckbox}
									</Label>
								</div>
							</div>
						</div>
						<SheetFooter>
							<Button variant='outline' onClick={() => setIsApproveSheetOpen(false)}>
								{t.cancel}
							</Button>
							<Button
								disabled={!fileName || !keyId.trim() || !approvePassword || !approveConfirmed}
								onClick={() => {
									if (!fileName || !keyId.trim()) {
										toast.error(text.toasts.kriptoUploadRequired)

										return
									}
									if (!approvePassword) {
										toast.error(text.toasts.kriptoPasswordRequired)

										return
									}

									onStatusChange(StatusEnum.APPROVED, {
										keyId,
										userId,
										password: approvePassword,
										confirmed: approveConfirmed,
									})
									setIsApproveSheetOpen(false)
									setKeyId('')
									setUserId('')
									setFileName('')
									setApprovePassword('')
									setApproveConfirmed(false)
								}}
							>
								{t.approveConfirm}
							</Button>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			)}
		</>
	)
})

RupReviewSheets.displayName = 'RupReviewSheets'
