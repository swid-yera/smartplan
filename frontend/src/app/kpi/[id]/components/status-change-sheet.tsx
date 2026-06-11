'use client'

import { useState } from 'react'

import { getUILocaleSection, normalizeStatus } from '@helpers'
import {
	Button,
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
import { useLocaleStore } from '@store'
import { StatusEnum } from '@types'

import localeDictionary from './locale.json'

interface IStatusChangeSheetProps {
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	onStatusChange: (newStatus: StatusEnum, reason: string) => void
}

export const StatusChangeSheet = ({ isOpen, onOpenChange, onStatusChange }: IStatusChangeSheetProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).statusSheet
	const [newStatus, setNewStatus] = useState<StatusEnum | undefined>(undefined)
	const [reason, setReason] = useState('')

	const onSheetSubmit = () => {
		if (!newStatus) return

		onStatusChange(newStatus, reason)
		setNewStatus(undefined)
		setReason('')
	}

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{t.title}</SheetTitle>
					<SheetDescription>{t.description}</SheetDescription>
				</SheetHeader>
				<div className='grid flex-1 auto-rows-min gap-6 p-4'>
					<div className='grid gap-2'>
						<Label htmlFor='status'>{t.statusLabel}</Label>
						<Select value={newStatus} onValueChange={(val) => setNewStatus(val as StatusEnum)}>
							<SelectTrigger className='w-full' id='status'>
								<SelectValue placeholder={t.statusPlaceholder} />
							</SelectTrigger>
							<SelectContent>
								{Object.values(StatusEnum).map((status) => (
									<SelectItem key={status} value={status}>
										{normalizeStatus(status, locale)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='reason'>{t.reasonLabel}</Label>
						<Textarea
							id='reason'
							placeholder={t.reasonPlaceholder}
							rows={7}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>
					</div>
				</div>
				<SheetFooter>
					<Button disabled={!newStatus} onClick={onSheetSubmit}>
						{t.save}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
