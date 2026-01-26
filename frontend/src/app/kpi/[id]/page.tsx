'use client'

import { type FC, useEffect, useState } from 'react'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle, StatusBadge } from '@components'
import { hasRole, isAuthor, normalizeCriteriaMethod, normalizeStatus } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CriteriaMethodEnum, type ICriteria, type IUpdateStatusRequest, StatusEnum, UserRoleEnum } from '@types'
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
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from '@ui'
import {
	Calendar,
	CheckCircle,
	Download,
	Edit,
	FileText,
	Link as LinkIcon,
	SendIcon,
	SendToBack,
	ShieldAlert,
	Trash,
	User,
	UserSearch,
} from 'lucide-react'
import Zoom from 'react-medium-image-zoom'
import { toast } from 'sonner'

const Page = () => {
	const { id } = useParams()
	const router = useRouter()
	// states
	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [generalComment, setGeneralComment] = useState('')
	const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false)
	const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false)
	// store
	const { user, authLoading } = useAuthStore()
	// queries
	const {
		data: award,
		isLoading,
		refetch,
	} = useQuery({
		...services.award.getByIdOptions(id as string),
		enabled: !!id && !authLoading,
	})
	// mutations
	const updateStatusMutation = useMutation(services.award.updateStatusOptions())
	const deleteMutation = useMutation(services.award.deleteMutationOptions())

	if (isLoading || authLoading || !user) return <Loader />

	if (!award) {
		return (
			<div className='flex flex-col items-center justify-center h-[50vh] space-y-4'>
				<h2 className='text-xl font-semibold'>Награда не найдена</h2>
				<Button onClick={() => router.back()}>Вернуться назад</Button>
			</div>
		)
	}

	// change award status
	const handleStatusChange = (newStatus: StatusEnum, reason?: string, totalPoints?: number) => {
		if (!award) return
		setIsSheetOpen(false)

		const toastId = `award-${award.id}-status-update-${newStatus}`
		const payloadTotalPoints: number = newStatus == StatusEnum.APPROVED ? totalPoints || 0 : 0
		const payloadReason: string = newStatus == StatusEnum.REJECTED ? reason || '' : ''

		toast.loading('Изменение статуса...', { id: toastId })
		const updateStatusPayload: IUpdateStatusRequest = {
			id: award.id,
			status: newStatus,
			reason: payloadReason,
			totalPoints: payloadTotalPoints,
		}

		updateStatusMutation.mutate(updateStatusPayload, {
			onSuccess: () => {
				toast.success('Статус успешно изменен!', { id: toastId })
				refetch()
			},
			onError: (err) => {
				toast.error('Произошла ошибка при изменении статуса', { id: toastId, description: err.message })
			},
		})
	}

	// delete award
	const handleDeleteAward = () => {
		if (!award) return
		setIsDeleteDialogOpen(false)

		const toastId = `award-${award.id}-delete`

		toast.loading(`Удаление...`, { id: toastId })

		deleteMutation.mutate(award.id, {
			onSuccess: () => {
				toast.success(`Успешно удален`, { id: toastId })
				router.replace('/kpi')
			},
			onError: (err) => {
				toast.error(`Произошла ошибка при удалений`, { id: toastId, description: err.message })
			},
		})
	}

	// bools
	const isAdmin = hasRole(user.role, UserRoleEnum.ADMIN)
	const isTeacher = hasRole(user.role, UserRoleEnum.TEACHER)
	const isStatusForEdit = award.status === StatusEnum.DRAFT || award.status === StatusEnum.REJECTED
	const isAwardCreator = isAuthor(user, award.teacher.keycloakId)
	// conditions
	const canEdit = (isAdmin || isTeacher) && isStatusForEdit
	const isMethodistReview = hasRole(user.role, UserRoleEnum.METHODIST, true) && award.status === StatusEnum.IN_REVIEW

	return (
		<div className='space-y-6 p-6 w-full'>
			<PageTitle
				actions={
					<ButtonGroup>
						<ButtonGroup>
							{isAdmin && (
								<Button
									className='hover:text-primary'
									size='sm'
									variant='outline'
									onClick={() => setIsSheetOpen(true)}
								>
									<ShieldAlert />
									Поменять статус
								</Button>
							)}
							{isAwardCreator && (
								<Button
									className='hover:text-destructive'
									size='sm'
									variant='outline'
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<Trash />
									Удалить
								</Button>
							)}
							{canEdit && (
								<Button asChild size='sm' variant='outline'>
									<Link href={`/kpi/${id}/edit`}>
										<Edit /> Редактировать
									</Link>
								</Button>
							)}
							{isStatusForEdit && (
								<Button
									className='hover:text-primary'
									size='sm'
									variant='outline'
									onClick={() => handleStatusChange(StatusEnum.IN_REVIEW)}
								>
									<SendIcon />
									Отправить на проверку
								</Button>
							)}
						</ButtonGroup>

						{isMethodistReview && (
							<ButtonGroup>
								<Button
									className='hover:text-destructive'
									size='sm'
									variant='outline'
									onClick={() => setIsRejectSheetOpen(true)}
								>
									<SendToBack className='mr-2 h-4 w-4' />
									Отклонить
								</Button>

								<Button
									className='hover:text-primary'
									size='sm'
									variant='outline'
									onClick={() => setIsApproveSheetOpen(true)}
								>
									<CheckCircle className='mr-2 h-4 w-4' />
									Утвердить
								</Button>
							</ButtonGroup>
						)}
					</ButtonGroup>
				}
				backHref={`/kpi`}
				description={'Просмотр'}
			>
				Детали достижения
			</PageTitle>

			{award.status === StatusEnum.REJECTED && (
				<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
					<div className='flex items-center gap-2 font-medium'>
						<ShieldAlert className='h-5 w-5' />
						Причина отказа
					</div>
					<div className='mt-2 text-sm whitespace-pre-wrap'>{award.reason || 'Пусто'}</div>
				</div>
			)}

			<div className='mt-6 grid gap-6 md:grid-cols-3'>
				<Card className='md:col-span-2'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-xl font-bold'>{award.variant.name}</CardTitle>
						<StatusBadge status={award.status} />
					</CardHeader>
					<CardContent className='space-y-4 pt-4'>
						<div className='grid gap-4 sm:grid-cols-2'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Тип критерия</p>
								<p className='text-base'>{award.type.name}</p>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Критерий</p>
								<p className='text-base'>{award.criteria.name}</p>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Метод оценки</p>
								<p className='text-base'>
									{normalizeCriteriaMethod(award.criteria.method, award.criteria.points)}
								</p>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Начисленные баллы</p>
								{award.status !== StatusEnum.APPROVED ? (
									<p className='text-base'>Баллы зачисляются после утверждений методиста</p>
								) : (
									<p className='text-2xl font-bold text-primary'>{award.totalPoints}</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Участники</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3 flex-1'>
						<div className='flex items-start gap-3'>
							<User className='mt-1 h-5 w-5 text-muted-foreground' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Преподаватель</p>
								<Link
									className='font-medium hover:underline hover:text-primary'
									href={`/users/${award.teacher.keycloakId}`}
								>
									{award.teacher.firstName} {award.teacher.lastName}
								</Link>
							</div>
						</div>

						{award.methodist && (
							<div className='flex items-start gap-3'>
								<UserSearch className='mt-1 h-5 w-5 text-muted-foreground' />
								<div>
									<p className='text-sm font-medium text-muted-foreground'>Методист</p>
									<Link
										className='font-medium hover:underline hover:text-primary'
										href={`/users/${award.methodist.keycloakId}`}
									>
										{award.methodist.firstName} {award.methodist.lastName}
									</Link>
								</div>
							</div>
						)}
					</CardContent>

					<CardFooter className='flex-col items-start'>
						<Separator className='my-2' />

						<div className='flex items-center gap-2 text-sm'>
							<Calendar className='h-4 w-4' />
							<span>Создано: {new Date(award.createdAt).toLocaleDateString()}</span>
						</div>

						<div className='flex items-center gap-2 text-sm'>
							<Calendar className='h-4 w-4' />
							<span>Обновлено: {new Date(award.updatedAt).toLocaleDateString()}</span>
						</div>
					</CardFooter>
				</Card>

				{/* Описание и файлы */}
				<Card className='md:col-span-3'>
					<CardHeader>
						<CardTitle>Материалы и описание</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div>
							<h3 className='mb-2 font-semibold'>Описание</h3>
							<div className='rounded-md bg-muted/50 p-4 text-sm whitespace-pre-wrap'>
								{award.text || 'Описание отсутствует'}
							</div>
						</div>

						<div className='grid gap-6 md:grid-cols-2'>
							{award.links && award.links.length > 0 && (
								<div>
									<h3 className='mb-2 font-semibold flex items-center gap-2'>
										<LinkIcon className='h-4 w-4' /> Ссылки
									</h3>
									<ul className='space-y-2'>
										{award.links.map((link, idx) => (
											<li key={idx} className='text-sm'>
												<a
													className='text-primary hover:underline break-all'
													href={link}
													rel='noopener noreferrer'
													target='_blank'
												>
													{link}
												</a>
											</li>
										))}
									</ul>
								</div>
							)}

							{award.files && award.files.length > 0 && (
								<div>
									<h3 className='mb-2 font-semibold flex items-center gap-2'>
										<FileText className='h-4 w-4' /> Файлы
									</h3>
									<div className='space-y-4'>
										{award.files.map((file, idx) => {
											const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(file)

											if (isImage) {
												return (
													<div key={idx} className='space-y-2 max-w-md'>
														<Zoom>
															<img
																alt='preview'
																className='cursor-zoom-in rounded-lg'
																height={300}
																src={file}
																width={400}
															/>
														</Zoom>
														<Button asChild size='sm' variant='outline'>
															<a download href={file} rel='noopener noreferrer' target='_blank'>
																<Download className='mr-2 h-4 w-4' />
																Скачать
															</a>
														</Button>
													</div>
												)
											}

											return (
												<div key={idx} className='text-sm flex items-center gap-2'>
													<FileText className='h-4 w-4 text-muted-foreground' />
													<a
														download
														className='truncate max-w-[300px] hover:underline text-primary'
														href={file}
														rel='noopener noreferrer'
														target='_blank'
													>
														{file}
													</a>
												</div>
											)
										})}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<StatusChangeSheet
				handleStatusChange={handleStatusChange}
				isSheetOpen={isSheetOpen}
				setIsSheetOpen={setIsSheetOpen}
			/>

			<RejectSheet
				generalComment={generalComment}
				isRejectSheetOpen={isRejectSheetOpen}
				setGeneralComment={setGeneralComment}
				setIsRejectSheetOpen={setIsRejectSheetOpen}
				onStatusChange={() => handleStatusChange(StatusEnum.REJECTED, generalComment)}
			/>

			<DeleteAlert
				isDeleteDialogOpen={isDeleteDialogOpen}
				setIsDeleteDialogOpen={setIsDeleteDialogOpen}
				onDelete={handleDeleteAward}
			/>

			<ApproveSheet
				criteria={award.criteria}
				isApproveSheetOpen={isApproveSheetOpen}
				setIsApproveSheetOpen={setIsApproveSheetOpen}
				onStatusChange={(totalPoints: number) => handleStatusChange(StatusEnum.APPROVED, '', totalPoints)}
			/>
		</div>
	)
}

export default Page

interface IStatusChangeSheetProps {
	isSheetOpen: boolean
	setIsSheetOpen: (state: boolean) => void
	handleStatusChange: (newStatus: StatusEnum, reason: string) => void
}

const StatusChangeSheet: FC<IStatusChangeSheetProps> = ({ isSheetOpen, setIsSheetOpen, handleStatusChange }) => {
	const [newStatus, setNewStatus] = useState<StatusEnum | undefined>(undefined)
	const [reason, setReason] = useState('')

	const onSheetSubmit = () => {
		if (newStatus) {
			handleStatusChange(newStatus, reason)

			setNewStatus(undefined)
			setReason('')
		}
	}

	return (
		<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Изменить статус</SheetTitle>
					<SheetDescription>Выберите новый статус для РУП и укажите причину изменения.</SheetDescription>
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

// reject sheet
interface IRejectSheet {
	isRejectSheetOpen: boolean
	setIsRejectSheetOpen: (state: boolean) => void
	generalComment: string
	setGeneralComment: (comment: string) => void
	onStatusChange: () => void
}

const RejectSheet: FC<IRejectSheet> = ({
	isRejectSheetOpen,
	setIsRejectSheetOpen,
	generalComment,
	setGeneralComment,
	onStatusChange,
}) => {
	return (
		<Sheet open={isRejectSheetOpen} onOpenChange={setIsRejectSheetOpen}>
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
					<Button variant='outline' onClick={() => setIsRejectSheetOpen(false)}>
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
							setIsRejectSheetOpen(false)
						}}
					>
						Отклонить
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

// approve sheet
interface IApproveSheet {
	isApproveSheetOpen: boolean
	setIsApproveSheetOpen: (state: boolean) => void
	onStatusChange: (awardPoints: number) => void
	criteria: ICriteria
}

const ApproveSheet: FC<IApproveSheet> = ({ isApproveSheetOpen, setIsApproveSheetOpen, onStatusChange, criteria }) => {
	const isMeasuring = criteria.method === CriteriaMethodEnum.MEASURING

	const min = criteria.points[0]
	const max = criteria.points[1] ?? criteria.points[0]

	const [awardPoints, setAwardPoints] = useState<number>(min)

	useEffect(() => {
		setAwardPoints(min)
	}, [criteria.id])

	const handleApprove = () => {
		onStatusChange(awardPoints)
		setIsApproveSheetOpen(false)
	}

	return (
		<Sheet open={isApproveSheetOpen} onOpenChange={setIsApproveSheetOpen}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Утвердить</SheetTitle>
					<SheetDescription>Проверка и утверждение баллов</SheetDescription>
				</SheetHeader>

				<div className='px-3 space-y-3 text-sm'>
					<p>
						<span className='text-muted-foreground'>Критерий:</span>{' '}
						<span className='font-medium'>{criteria.name}</span>
					</p>

					<p>
						<span className='text-muted-foreground'>Метод:</span>{' '}
						<span className='font-medium'>
							{criteria.method === CriteriaMethodEnum.NORMAL ? 'Фиксированный' : 'Измеряемый'}
						</span>
					</p>

					{/* NORMAL */}
					{criteria.method === CriteriaMethodEnum.NORMAL && (
						<div className='rounded-md border px-3 py-2 bg-muted'>
							<p>
								Балл за критерий: <span className='font-semibold'>{criteria.points[0]}</span>
							</p>
						</div>
					)}

					{/* MEASURING */}
					{isMeasuring && (
						<div className='space-y-2'>
							<Label htmlFor='points'>
								Балл ({min} – {max})
							</Label>
							<Input
								id='points'
								max={max}
								min={min}
								type='number'
								value={awardPoints}
								onChange={(e) => {
									const value = Number(e.target.value)

									if (Number.isNaN(value)) return

									setAwardPoints(Math.min(Math.max(value, min), max))
								}}
							/>
						</div>
					)}
				</div>

				<SheetFooter className='mt-4'>
					<Button variant='outline' onClick={() => setIsApproveSheetOpen(false)}>
						Отмена
					</Button>
					<Button variant='default' onClick={handleApprove}>
						Утвердить
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
}

const DeleteAlert: FC<IDeleteAlert> = ({ isDeleteDialogOpen, setIsDeleteDialogOpen, onDelete }) => {
	return (
		<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Вы уверены?</AlertDialogTitle>
					<AlertDialogDescription>
						Это действие невозможно отменить. Это приведет к необратимому удалению рабочего учебного плана.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Отмена</AlertDialogCancel>
					<AlertDialogAction variant='destructive' onClick={onDelete}>
						Удалить
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
