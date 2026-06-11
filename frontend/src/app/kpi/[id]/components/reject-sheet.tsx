'use client'

import { getUILocaleSection } from '@helpers'
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
import { useLocaleStore } from '@store'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

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
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).rejectSheet

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{t.title}</SheetTitle>
					<SheetDescription>{t.description}</SheetDescription>
				</SheetHeader>
				<div className='px-4 grid gap-4 py-4'>
					<div className='grid gap-2'>
						<Label htmlFor='reject-reason'>{t.reasonLabel}</Label>
						<Textarea
							id='reject-reason'
							placeholder={t.reasonPlaceholder}
							rows={12}
							value={generalComment}
							onChange={(e) => setGeneralComment(e.target.value)}
						/>
					</div>
				</div>
				<SheetFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						{t.cancel}
					</Button>
					<Button
						disabled={!generalComment}
						variant='destructive'
						onClick={() => {
							if (!generalComment.trim()) {
								toast.error(t.reasonRequired)

								return
							}
							onStatusChange()
							onOpenChange(false)
						}}
					>
						{t.reject}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
