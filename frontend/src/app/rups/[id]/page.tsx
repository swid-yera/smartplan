'use client'

import { type FC, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { Loader } from '@components'
import { hasRole, normalizeRupStatus } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateRupStatusRequest, RupStatusEnum, UserRoleEnum } from '@types'
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
} from '@ui'
import { Edit, FileDown, SendIcon, ShieldAlert, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { RupView } from './rup-view'

const Page: FC = () => {
	const { replace } = useRouter()
	const params = useParams<{ id: string }>()

	const { authLoading, user } = useAuthStore()

	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	// get data on initial
	const { data: rupData, isLoading } = useQuery({ ...services.rup.getByIdOptions(params.id), enabled: !!params.id })
	// mutations
	const updateStatusMutation = useMutation(services.rup.updateStatusOptions())
	const deleteMutation = useMutation(services.rup.deleteMutationOptions())

	// change rup status
	const handleStatusChange = (newStatus: RupStatusEnum, reason?: string) => {
		if (!rupData) return
		setIsSheetOpen(false)

		const toastId = `rup-${rupData.id}-status-update-${newStatus}`

		toast.loading('Изменение статуса...', { id: toastId })
		const updateStatusPayload: IUpdateRupStatusRequest = { id: rupData.id, status: newStatus, reason }

		updateStatusMutation.mutate(updateStatusPayload, {
			onSuccess: () => {
				toast.success('Статус успешно изменен!', { id: toastId })
			},
			onError: (err) => {
				toast.error('Произошла ошибка при изменении статуса', { id: toastId, description: err.message })
			},
		})
	}

	// delete rup
	const handleDeleteRup = () => {
		if (!rupData) return
		setIsDeleteDialogOpen(false)

		const toastId = `rup-${rupData.id}-delete`
		const rupName = rupData.code || 'РУП'

		toast.loading(`Удаление ${rupName}...`, { id: toastId })

		deleteMutation.mutate(rupData.id, {
			onSuccess: () => {
				toast.success(`${rupName} успешно удален`, { id: toastId })
				replace('/rups')
			},
			onError: (err) => {
				toast.error(`Произошла ошибка при удалений ${rupName}`, { id: toastId, description: err.message })
			},
		})
	}

	// TODO: realize it
	const onDownload = () => {
		toast.promise(() => new Promise((resolve) => setTimeout(() => resolve({ name: 'Event' }), 2000)), {
			loading: 'Загрузка...',
			success: (data) => `${data} has been created`,
			error: 'Error',
		})
	}

	// loading
	if (authLoading || isLoading) return <Loader />
	if (!user || !rupData) return notFound()

	// bools
	const isAdmin = hasRole(user.role, UserRoleEnum.ADMIN)
	const isTeacher = hasRole(user.role, UserRoleEnum.TEACHER)
	const isStatusForEdit = rupData.status === RupStatusEnum.DRAFT || rupData.status === RupStatusEnum.REJECTED
	// @ts-ignore
	const isUserCreator = hasRole(user.role, UserRoleEnum.TEACHER) && rupData?.teacher?.keycloak_id == user.keycloakID
	// conditions
	const canEdit = (isAdmin || isTeacher) && isStatusForEdit
	const canDownload = rupData.status === RupStatusEnum.APPROVED
	const canSendToReview = isUserCreator && rupData.status === RupStatusEnum.DRAFT
	const canDelete = isAdmin || (isUserCreator && rupData.status === RupStatusEnum.DRAFT)

	return (
		<>
			<RupView
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
								Поменять статус
							</Button>
						)}
						{canDelete && (
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
								<Link href={`/rups/${params.id}/edit`}>
									<Edit /> Редактировать
								</Link>
							</Button>
						)}
						{canDownload && (
							<Button className='hover:text-primary' size='sm' variant='outline' onClick={onDownload}>
								<FileDown className='mr-2 h-4 w-4' />
								Скачать файл
							</Button>
						)}
						{canSendToReview && (
							<Button
								className='hover:text-primary'
								size='sm'
								variant='outline'
								onClick={() => handleStatusChange(RupStatusEnum.IN_REVIEW)}
							>
								<SendIcon />
								Отправить на согласование
							</Button>
						)}
					</ButtonGroup>
				}
				data={rupData}
				role={user.role}
				onStatusChange={handleStatusChange}
			/>

			<StatusChangeSheet
				handleStatusChange={handleStatusChange}
				isSheetOpen={isSheetOpen}
				setIsSheetOpen={setIsSheetOpen}
			/>

			<DeleteAlert
				isDeleteDialogOpen={isDeleteDialogOpen}
				setIsDeleteDialogOpen={setIsDeleteDialogOpen}
				onDelete={handleDeleteRup}
			/>
		</>
	)
}

export default Page

interface IStatusChangeSheetProps {
	isSheetOpen: boolean
	setIsSheetOpen: (state: boolean) => void
	handleStatusChange: (newStatus: RupStatusEnum, reason: string) => void
}

const StatusChangeSheet: FC<IStatusChangeSheetProps> = ({ isSheetOpen, setIsSheetOpen, handleStatusChange }) => {
	const [newStatus, setNewStatus] = useState<RupStatusEnum | undefined>(undefined)
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
						<Select value={newStatus} onValueChange={(val) => setNewStatus(val as RupStatusEnum)}>
							<SelectTrigger className='w-full' id='status'>
								<SelectValue placeholder='Выберите статус' />
							</SelectTrigger>
							<SelectContent>
								{Object.values(RupStatusEnum).map((status) => (
									<SelectItem key={status} value={status}>
										{normalizeRupStatus(status)}
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
