'use client'

import {
	Button,
	Label,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from '@shadcn'
import { toast } from 'sonner'

interface IRejectSheetProps {
	isOpen: boolean
	onOpenChange: (state: boolean) => void
	generalComment: string
	setGeneralComment: (comment: string) => void
	onStatusChange: () => void
}

export const RejectSheet = ({
	isOpen,
	onOpenChange,
	generalComment,
	setGeneralComment,
	onStatusChange,
}: IRejectSheetProps) => {
	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Отклонить</SheetTitle>
					<SheetDescription>
						Укажите причину отклонения (проблемы), чтобы преподаватель мог их исправить.
					</SheetDescription>
				</SheetHeader>
				<div className='px-4 grid gap-4 py-4'>
					<div className='grid gap-2'>
						<Label htmlFor='reject-reason'>Причина отказа</Label>
						<Textarea
							id='reject-reason'
							placeholder='Опишите проблемы...'
							rows={12}
							value={generalComment}
							onChange={(e) => setGeneralComment(e.target.value)}
						/>
					</div>
				</div>
				<SheetFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						Отмена
					</Button>
					<Button
						disabled={!generalComment}
						variant='destructive'
						onClick={() => {
							if (!generalComment.trim()) {
								toast.error('Пожалуйста, укажите причину отклонения')

								return
							}
							onStatusChange()
							onOpenChange(false)
						}}
					>
						Отклонить
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
