'use client'

import { type FC, useState } from 'react'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'

import { Loader } from '@components'
import { hasRole, isAuthor, normalizeStatus } from '@helpers'
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
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateStatusRequest, RoleEnum, StatusEnum } from '@types'
import { Edit, FileDown, SendIcon, ShieldAlert, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { RupView } from './rup-view'

const Page: FC = () => {
	const { replace } = useRouter()
	const params = useParams<{ id: string }>()

	const { authLoading, user } = useAuthStore()

	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	// queries
	const { data: rupData, isLoading } = useQuery({ ...services.rup.getByIdOptions(params.id), enabled: !!params.id })
	const { refetch: getDownloadUrl } = useQuery({
		...services.rup.getDownloadUrlOptions(params.id),
		enabled: false,
	})
	// mutations
	const updateStatusMutation = useMutation(services.rup.updateStatusOptions())
	const deleteMutation = useMutation(services.rup.deleteMutationOptions())

	// change rup status
	const handleStatusChange = (newStatus: StatusEnum, reason?: string) => {
		if (!rupData) return
		setIsSheetOpen(false)

		const toastId = `rup-${rupData.id}-status-update-${newStatus}`

		toast.loading('Изменение статуса...', { id: toastId })
		const updateStatusPayload: IUpdateStatusRequest = { id: rupData.id, status: newStatus, reason }

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
		const rupName = rupData.name || 'РУП'

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

	const onDownload = () => {
		toast.promise(
			async () => {
				const { data } = await getDownloadUrl()

				if (!data) throw new Error('Не удалось получить ссылку на файл')

				const link = document.createElement('a')

				link.href = data.url
				link.setAttribute('download', `RUP_${rupData?.name || 'file'}.docx`)
				document.body.appendChild(link)
				link.click()
				link.remove()
			},
			{
				loading: 'Подготовка файла...',
				success: 'Файл скачивается',
				error: 'Ошибка при скачивании',
			},
		)
	}

	// loading
	if (authLoading || isLoading) return <Loader />
	if (!user || !rupData) return notFound()

	// bools
	const isAdmin = hasRole(user.role, RoleEnum.ADMIN)
	const isStatusForEdit = rupData.status === StatusEnum.DRAFT || rupData.status === StatusEnum.REJECTED
	const isRupCreator = isAuthor(user, rupData.teacher.keycloakId)
	const isRupDeveloper = isRupCreator || rupData.contacts.some((contact) => contact.keycloakId === user.keycloakId)
	// conditions
	const canDownload = rupData.status === StatusEnum.APPROVED

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
						{isRupCreator && isStatusForEdit && (
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
						{isRupDeveloper && isStatusForEdit && (
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
						{isRupDeveloper && isStatusForEdit && (
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
						Это действие невозможно отменить. Это приведет к необратимому удалению рабочей учебной программы.
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
