'use client'

import { useState } from 'react'

import { normalizeStatus } from '@helpers'
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
import { StatusEnum } from '@types'

interface IStatusChangeSheetProps {
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	onStatusChange: (newStatus: StatusEnum, reason: string) => void
}

export const StatusChangeSheet = ({ isOpen, onOpenChange, onStatusChange }: IStatusChangeSheetProps) => {
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
					<SheetTitle>Изменить статус</SheetTitle>
					<SheetDescription>Выберите новый статус для KPI и укажите причину изменения.</SheetDescription>
				</SheetHeader>
				<div className='grid flex-1 auto-rows-min gap-6 p-4'>
					<div className='grid gap-2'>
						<Label htmlFor='status'>Статус</Label>
						<Select value={newStatus} onValueChange={(val) => setNewStatus(val as StatusEnum)}>
							<SelectTrigger className='w-full' id='status'>
								<SelectValue placeholder='Выберите статус' />
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
						<Label htmlFor='reason'>Причина / Комментарий</Label>
						<Textarea
							id='reason'
							placeholder='Укажите причину...'
							rows={7}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>
					</div>
				</div>
				<SheetFooter>
					<Button disabled={!newStatus} onClick={onSheetSubmit}>
						Сохранить
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
