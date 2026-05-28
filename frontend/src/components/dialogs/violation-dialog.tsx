'use client'

import { type FC, useEffect, useState } from 'react'

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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Textarea,
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { IViolationRecord } from '@types'
import { Trash2 } from 'lucide-react'

interface IViolationDialogProps {
	open: boolean
	onOpenChange: (state: boolean) => void
	onSubmit: (payload: { note: string }) => void
	pending?: boolean
	pendingDelete?: boolean
	initialNote?: string
	currentStatusLabel: string
	nextStatusLabel: string
	violations?: IViolationRecord[]
	onDeleteViolation?: (violationId: string) => void
	isMaxViolation?: boolean
}

const dictionary = {
	ru: {
		createTitle: 'Сделать выговор',
		editTitle: 'Изменить выговор',
		description: 'При нарушении условий трудового договора вычитается от 10 до 30 баллов.',
		rulesTitle: 'Условия списания',
		rulesList: ['Нету нарушений', 'Замечание (-10 баллов)', 'Выговор (-20 баллов)', 'Строгий выговор (-30 баллов)'],
		currentStatus: 'Текущий статус',
		nextStatus: 'Следующий статус',
		maxViolationMessage: 'У пользователя уже установлен строгий выговор. Следующее действие невозможно.',
		historyTitle: 'История выговоров',
		emptyHistory: 'Выговоров пока нет',
		remove: 'Удалить',
		deleteTitle: 'Удалить выговор?',
		deleteDescription: 'Это действие удалит выбранный выговор.',
		confirmDelete: 'Удалить',
		saveTitle: 'Подтвердите действие',
		saveDescription: 'После сохранения у пользователя вычтется 10 баллов из общего количества баллов.',
		confirmSave: 'Подтвердить',
		noteLabel: 'Комментарий',
		notePlaceholder: 'Укажите причину (необязательно)',
		save: 'Сохранить',
		cancel: 'Отмена',
	},
	kk: {
		createTitle: 'Сөгіс беру',
		editTitle: 'Сөгісті өзгерту',
		description: 'Еңбек шарты бұзылса, 10-нан 30-ға дейін ұпай шегеріледі.',
		rulesTitle: 'Ұпай шегеру шарттары',
		rulesList: ['Бұзушылық жоқ', 'Ескерту (-10 ұпай)', 'Сөгіс (-20 ұпай)', 'Қатаң сөгіс (-30 ұпай)'],
		currentStatus: 'Ағымдағы статус',
		nextStatus: 'Келесі статус',
		maxViolationMessage: 'Пайдаланушыда қатаң сөгіс қойылған. Келесі әрекет мүмкін емес.',
		historyTitle: 'Сөгіс тарихы',
		emptyHistory: 'Сөгістер жоқ',
		remove: 'Жою',
		deleteTitle: 'Сөгісті жою керек пе?',
		deleteDescription: 'Бұл әрекет таңдалған сөгісті жояды.',
		confirmDelete: 'Жою',
		saveTitle: 'Әрекетті растаңыз',
		saveDescription: 'Сақтағаннан кейін пайдаланушының жалпы ұпайынан 10 ұпай шегеріледі.',
		confirmSave: 'Растау',
		noteLabel: 'Түсініктеме',
		notePlaceholder: 'Себебін енгізіңіз (міндетті емес)',
		save: 'Сақтау',
		cancel: 'Болдырмау',
	},
} as const

export const ViolationDialog: FC<IViolationDialogProps> = ({
	open,
	onOpenChange,
	onSubmit,
	pending = false,
	pendingDelete = false,
	initialNote = '',
	currentStatusLabel,
	nextStatusLabel,
	violations = [],
	onDeleteViolation,
	isMaxViolation = false,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = dictionary[locale] ?? dictionary.ru
	const [note, setNote] = useState(initialNote)
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null)
	const [saveDialogOpen, setSaveDialogOpen] = useState(false)

	useEffect(() => {
		if (!open) return
		setNote(initialNote)
	}, [initialNote, open])

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className='max-h-[85vh] overflow-hidden'>
					<DialogHeader>
						<DialogTitle>{t.createTitle}</DialogTitle>
						<DialogDescription>{t.description}</DialogDescription>
					</DialogHeader>

					<div className='grid max-h-[60vh] gap-4 overflow-y-auto py-2 pr-1'>
						<div className='rounded-md border border-destructive/40 bg-destructive/5 p-3'>
							<p className='text-sm font-semibold text-destructive'>{t.rulesTitle}</p>
							<ul className='mt-1 italic list-inside list-disc space-y-1 text-sm text-muted-foreground'>
								{t.rulesList.map((rule: string) => (
									<li key={rule}>{rule}</li>
								))}
							</ul>
							<p className='mt-6 text-sm'>
								<span className='text-muted-foreground'>{t.currentStatus}: </span>
								{currentStatusLabel}
							</p>
							<p className='text-sm'>
								<span className='text-muted-foreground'>{t.nextStatus}: </span>
								{nextStatusLabel}
							</p>
							{isMaxViolation && (
								<p className='mt-2 text-sm font-medium text-destructive'>{t.maxViolationMessage}</p>
							)}
						</div>

						{!isMaxViolation && (
							<div className='grid gap-2'>
								<Label htmlFor='violation-note'>{t.noteLabel}</Label>
								<Textarea
									id='violation-note'
									placeholder={t.notePlaceholder}
									rows={4}
									value={note}
									onChange={(event) => setNote(event.target.value)}
								/>
							</div>
						)}

						<div className='grid gap-2'>
							<p className='text-sm font-semibold'>{t.historyTitle}</p>
							{violations.length === 0 ? (
								<p className='text-sm text-muted-foreground'>{t.emptyHistory}</p>
							) : (
								<div className='max-h-48 space-y-2 overflow-y-auto pr-1'>
									{violations.map((violation) => (
										<div key={violation.id} className='rounded-md border p-2'>
											<div className='flex items-start justify-between gap-2'>
												<div>
													<p className='text-sm'>{violation.note || '—'}</p>
													<p className='text-xs text-muted-foreground'>
														{new Date(violation.createdAt).toLocaleString(dateLocale)}
													</p>
												</div>
												<Button
													disabled={pendingDelete || !onDeleteViolation}
													size='icon'
													variant='ghost'
													onClick={() => {
														setSelectedViolationId(violation.id)
														setDeleteDialogOpen(true)
													}}
												>
													<Trash2 className='h-4 w-4 text-destructive' />
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => onOpenChange(false)}>
							{t.cancel}
						</Button>
						{!isMaxViolation && (
							<Button disabled={pending} onClick={() => setSaveDialogOpen(true)}>
								{t.save}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
						<AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSelectedViolationId(null)}>{t.cancel}</AlertDialogCancel>
						<AlertDialogAction
							className='bg-destructive hover:bg-destructive/90'
							disabled={pendingDelete}
							onClick={() => {
								if (!selectedViolationId || !onDeleteViolation) return
								onDeleteViolation(selectedViolationId)
								setDeleteDialogOpen(false)
								setSelectedViolationId(null)
							}}
						>
							{t.confirmDelete}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t.saveTitle}</AlertDialogTitle>
						<AlertDialogDescription>{t.saveDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t.cancel}</AlertDialogCancel>
						<AlertDialogAction
							disabled={pending}
							onClick={() => {
								onSubmit({ note: note.trim() })
								setSaveDialogOpen(false)
							}}
						>
							{t.confirmSave}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
