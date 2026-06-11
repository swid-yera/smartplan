'use client'

import { type FC, useMemo, useState } from 'react'

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
	Input,
	Label,
	Separator,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation } from '@tanstack/react-query'
import type { IPenalty } from '@types'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface IPenaltySheetProps {
	teacherId: string
	open: boolean
	onOpenChange: (state: boolean) => void
	penalties: IPenalty[]
	isLoading?: boolean
}

const dictionary = {
	ru: {
		title: 'Нарушения',
		description: 'Добавить нарушения и просмотр нарушений пользователя',
		pointsLabel: 'Списываемые баллы',
		noteLabel: 'Комментарий / причина',
		pointsPlaceholder: 'Введите число, например 10',
		notePlaceholder: 'Например: Опоздал со сдачей отчета',
		create: 'Создать нарушение',
		delete: 'Удалить',
		empty: 'Нарушений пока нет',
		loading: 'Загрузка нарушений...',
		saved: 'Нарушение добавлено',
		deleted: 'Нарушение удалено',
		validationPoints: 'Укажите баллы больше 0',
		validationNote: 'Укажите причину нарушения',
		points: 'баллов',
		deleteTitle: 'Удалить нарушение?',
		deleteDescription: 'Это действие удалит запись нарушения и вернет баллы пользователю.',
		cancel: 'Отмена',
		confirmDelete: 'Удалить',
	},
	kk: {
		title: 'Бұзушылықтар және айыппұлдар',
		description: 'Бұзушылықтар жасау және пайдаланушы бұзушылықтарын қарау',
		pointsLabel: 'Шегерілетін ұпай',
		noteLabel: 'Түсіндірме / себеп',
		pointsPlaceholder: 'Санды енгізіңіз, мысалы 10',
		notePlaceholder: 'Мысалы: Есепті кеш тапсырды',
		create: 'Бұзушылық қосу',
		delete: 'Жою',
		empty: 'Бұзушылықтар жоқ',
		loading: 'Бұзушылықтар жүктелуде...',
		saved: 'Бұзушылық қосылды',
		deleted: 'Бұзушылық жойылды',
		validationPoints: '0-ден жоғары ұпай енгізіңіз',
		validationNote: 'Бұзушылық себебін енгізіңіз',
		points: 'ұпай',
		deleteTitle: 'Бұзушылықты жою керек пе?',
		deleteDescription: 'Бұл әрекет бұзушылық жазбасын жояды және пайдаланушыға ұпайды қайтарады.',
		cancel: 'Болдырмау',
		confirmDelete: 'Жою',
	},
} as const

export const PenaltySheet: FC<IPenaltySheetProps> = ({
	teacherId,
	open,
	onOpenChange,
	penalties,
	isLoading = false,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = dictionary[locale] ?? dictionary.ru
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const [points, setPoints] = useState('')
	const [note, setNote] = useState('')
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedPenaltyId, setSelectedPenaltyId] = useState<string | null>(null)

	const createPenaltyMutation = useMutation(services.user.createPenaltyOptions(teacherId))
	const deletePenaltyMutation = useMutation(services.user.deletePenaltyByIdAndTeacherIdOptions(teacherId))

	const sortedPenalties = useMemo(
		() => [...penalties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
		[penalties],
	)

	const onPointsChange = (value: string) => {
		if (/^\d*$/.test(value)) {
			setPoints(value)
		}
	}

	const onCreatePenalty = () => {
		const parsedPoints = Number(points)

		if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
			toast.error(t.validationPoints)

			return
		}

		if (!note.trim()) {
			toast.error(t.validationNote)

			return
		}

		createPenaltyMutation.mutate(
			{ points: parsedPoints, note: note.trim() },
			{
				onSuccess: () => {
					setPoints('')
					setNote('')
					toast.success(t.saved)
				},
				onError: (error) => {
					toast.error(error.message)
				},
			},
		)
	}

	const onDeletePenalty = () => {
		if (!selectedPenaltyId) return

		deletePenaltyMutation.mutate(selectedPenaltyId, {
			onSuccess: () => {
				setDeleteDialogOpen(false)
				setSelectedPenaltyId(null)
				toast.success(t.deleted)
			},
			onError: (error) => {
				toast.error(error.message)
			},
		})
	}

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className='flex h-full flex-col sm:max-w-lg'>
					<SheetHeader>
						<SheetTitle>{t.title}</SheetTitle>
						<SheetDescription>{t.description}</SheetDescription>
					</SheetHeader>

					<div className='grid gap-4 px-4 py-2'>
						<div className='grid gap-2'>
							<Label htmlFor='penalty-points'>{t.pointsLabel}</Label>
							<Input
								id='penalty-points'
								inputMode='numeric'
								min={1}
								placeholder={t.pointsPlaceholder}
								pattern='[0-9]*'
								type='text'
								value={points}
								onChange={(e) => onPointsChange(e.target.value)}
								onPaste={(e) => {
									const pasted = e.clipboardData.getData('text')
									if (!/^\d*$/.test(pasted)) {
										e.preventDefault()
									}
								}}
								onKeyDown={(e) => {
									if (
										!['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(
											e.key,
										) &&
										!/^\d$/.test(e.key)
									) {
										e.preventDefault()
									}
								}}
							/>
						</div>

						<div className='grid gap-2'>
							<Label htmlFor='penalty-note'>{t.noteLabel}</Label>
							<Textarea
								id='penalty-note'
								placeholder={t.notePlaceholder}
								rows={4}
								value={note}
								onChange={(e) => setNote(e.target.value)}
							/>
						</div>
					</div>

					<SheetFooter className='px-4'>
						<Button disabled={createPenaltyMutation.isPending} onClick={onCreatePenalty}>
							{t.create}
						</Button>
					</SheetFooter>

					<Separator className='my-3' />

					<div className='flex-1 space-y-2 overflow-y-auto px-4 pb-4'>
						{isLoading ? (
							<p className='text-sm text-muted-foreground'>{t.loading}</p>
						) : sortedPenalties.length === 0 ? (
							<p className='text-sm text-muted-foreground'>{t.empty}</p>
						) : (
							sortedPenalties.map((penalty) => (
								<div key={penalty.id} className='space-y-2 rounded-md border p-3'>
									<div className='flex items-start justify-between gap-2'>
										<div>
											<p className='font-semibold text-destructive'>
												-{penalty.points} {t.points}
											</p>
											<p className='text-sm'>{penalty.note}</p>
											<p className='mt-1 text-xs text-muted-foreground'>
												{new Date(penalty.createdAt).toLocaleString(dateLocale)}
											</p>
										</div>
										<Button
											disabled={deletePenaltyMutation.isPending}
											size='icon'
											variant='ghost'
											onClick={() => {
												setSelectedPenaltyId(penalty.id)
												setDeleteDialogOpen(true)
											}}
										>
											<Trash2 className='h-4 w-4 text-destructive' />
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				</SheetContent>
			</Sheet>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
						<AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSelectedPenaltyId(null)}>{t.cancel}</AlertDialogCancel>
						<AlertDialogAction
							className='bg-destructive hover:bg-destructive/90'
							disabled={deletePenaltyMutation.isPending}
							onClick={onDeletePenalty}
						>
							{t.confirmDelete}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
