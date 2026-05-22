'use client'

import { useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle, ResponsibleUsersCard, StatusInfoCard } from '@components'
import { hasRole, isAuthor } from '@helpers'
import { services } from '@services'
import { Button } from '@shadcn'
import { useAuthStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateStatusRequest, RoleEnum, StatusEnum } from '@types'
import { toast } from 'sonner'

import { ApproveSheet } from './components/approve-sheet'
import { AwardFieldValuesCard } from './components/award-field-values-card'
import { AwardMainInfoCard } from './components/award-main-info-card'
import { DeleteAlert } from './components/delete-alert'
import { KpiDetailsActions } from './components/kpi-details-actions'
import { RejectSheet } from './components/reject-sheet'
import { StatusChangeSheet } from './components/status-change-sheet'

const Page = () => {
	const { id } = useParams()
	const router = useRouter()

	const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [generalComment, setGeneralComment] = useState('')
	const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false)
	const [isApproveSheetOpen, setIsApproveSheetOpen] = useState(false)

	const { user, authLoading } = useAuthStore()

	const {
		data: award,
		isLoading,
		refetch,
	} = useQuery({
		...services.award.getByIdOptions(id as string),
		enabled: !!id && !authLoading,
	})

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

	const handleStatusChange = (newStatus: StatusEnum, reason?: string, totalPoints?: number) => {
		setIsStatusSheetOpen(false)

		const toastId = `award-${award.id}-status-update-${newStatus}`
		const payloadTotalPoints = newStatus === StatusEnum.APPROVED ? totalPoints || 0 : 0
		const payloadReason = newStatus === StatusEnum.REJECTED ? reason || '' : ''

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

	const handleDeleteAward = () => {
		setIsDeleteDialogOpen(false)

		const toastId = `award-${award.id}-delete`

		toast.loading('Удаление...', { id: toastId })

		deleteMutation.mutate(award.id, {
			onSuccess: () => {
				toast.success('Успешно удален', { id: toastId })
				router.replace('/kpi')
			},
			onError: (err) => {
				toast.error('Произошла ошибка при удалений', { id: toastId, description: err.message })
			},
		})
	}

	const isAdmin = hasRole(user.role, RoleEnum.ADMIN)
	const isTeacher = hasRole(user.role, RoleEnum.TEACHER)
	const isStatusForEdit = award.status === StatusEnum.DRAFT || award.status === StatusEnum.REJECTED
	const isAwardCreator = isAuthor(user, award.teacher.keycloakId)
	const canEdit = (isAdmin || isTeacher) && isStatusForEdit
	const isMethodistReview = hasRole(user.role, RoleEnum.METHODIST, true) && award.status === StatusEnum.IN_REVIEW

	return (
		<div className='space-y-6 p-6 w-full'>
			<PageTitle
				actions={
					<KpiDetailsActions
						canEdit={canEdit}
						id={String(id)}
						isAdmin={isAdmin}
						isAwardCreator={isAwardCreator}
						isMethodistReview={isMethodistReview}
						isStatusForEdit={isStatusForEdit}
						onOpenApproveSheet={() => setIsApproveSheetOpen(true)}
						onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
						onOpenRejectSheet={() => setIsRejectSheetOpen(true)}
						onOpenStatusSheet={() => setIsStatusSheetOpen(true)}
						onSendToReview={() => handleStatusChange(StatusEnum.IN_REVIEW)}
					/>
				}
				backHref='/kpi/my'
				description='Просмотр'
			>
				Детали KPI данных
			</PageTitle>

			<StatusInfoCard
				messages={{
					approved: 'Редактирование недоступно после утверждения.',
					draft: 'Проверьте данные и отправьте на согласование.',
					inReview: 'Ожидайте, пока методист проверит ваши данные.',
				}}
				reason={award.reason}
				status={award.status}
			/>

			<div className='mt-6 grid gap-6 md:grid-cols-3'>
				<AwardMainInfoCard award={award} />

				<ResponsibleUsersCard
					createdAt={award.createdAt}
					methodist={award.methodist}
					teacher={award.teacher}
					updatedAt={award.updatedAt}
				/>

				<AwardFieldValuesCard award={award} />
			</div>

			<StatusChangeSheet
				isOpen={isStatusSheetOpen}
				onOpenChange={setIsStatusSheetOpen}
				onStatusChange={handleStatusChange}
			/>

			<RejectSheet
				generalComment={generalComment}
				isOpen={isRejectSheetOpen}
				setGeneralComment={setGeneralComment}
				onOpenChange={setIsRejectSheetOpen}
				onStatusChange={() => handleStatusChange(StatusEnum.REJECTED, generalComment)}
			/>

			<DeleteAlert isOpen={isDeleteDialogOpen} onDelete={handleDeleteAward} onOpenChange={setIsDeleteDialogOpen} />

			<ApproveSheet
				criteria={award.criteria}
				isOpen={isApproveSheetOpen}
				onOpenChange={setIsApproveSheetOpen}
				onStatusChange={(totalPoints) => handleStatusChange(StatusEnum.APPROVED, '', totalPoints)}
			/>
		</div>
	)
}

export default Page
