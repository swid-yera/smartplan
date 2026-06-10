'use client'

import { useMemo, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle, ResponsibleUsersCard, StatusInfoCard, withPermission } from '@components'
import { getUILocaleSection, hasAnyPermission, hasPermission } from '@helpers'
import { services } from '@services'
import { Button } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IUpdateStatusRequest, type IVariant, PermissionCodeEnum, StatusEnum } from '@types'
import { toast } from 'sonner'

import { ApproveSheet } from './components/approve-sheet'
import { AwardFieldValuesCard } from './components/award-field-values-card'
import { AwardMainInfoCard } from './components/award-main-info-card'
import { DeleteAlert } from './components/delete-alert'
import { KpiDetailsActions } from './components/kpi-details-actions'
import localeDictionary from './components/locale.json'
import { RejectSheet } from './components/reject-sheet'
import { StatusChangeSheet } from './components/status-change-sheet'

const Page = () => {
	const { id } = useParams()
	const router = useRouter()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).page

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

	const { data: awardType } = useQuery({
		...services.award.getTypeByIdOptions(award?.type.id || ''),
		enabled: !!award?.type?.id,
	})

	const updateStatusMutation = useMutation(services.award.updateStatusOptions())
	const deleteMutation = useMutation(services.award.deleteMutationOptions())
	const backHref = '/kpi/entry'

	const fallbackVariant = useMemo(
		() =>
			award
				? ({
						...award.variant,
						criteria: [award.criteria],
						bonus_criteria: award.bonus_criteria ? [award.bonus_criteria] : [],
					} as IVariant)
				: null,
		[award?.bonus_criteria, award?.criteria, award?.variant],
	)
	const variantOptions = useMemo(() => {
		if (awardType?.variants?.length) return awardType.variants

		return fallbackVariant ? [fallbackVariant] : []
	}, [awardType?.variants, fallbackVariant])
	const selectedVariant = useMemo(
		() =>
			award
				? variantOptions.find((variant) => variant.id === award.variant.id) || variantOptions[0] || fallbackVariant
				: null,
		[award, award?.variant.id, fallbackVariant, variantOptions],
	)
	const selectedCriteria = useMemo(
		() =>
			award
				? selectedVariant?.criteria?.find((criteria) => criteria.id === award.criteria.id) || award.criteria
				: null,
		[award, award?.criteria, selectedVariant],
	)
	const selectedBonusCriteria = useMemo(
		() =>
			award?.bonus_criteria
				? selectedVariant?.bonus_criteria?.find((criteria) => criteria.id === award.bonus_criteria?.id) ||
					award.bonus_criteria
				: null,
		[award, award?.bonus_criteria, selectedVariant],
	)

	if (isLoading || authLoading || !user) return <Loader />

	if (!award) {
		return (
			<div className='flex flex-col items-center justify-center h-[50vh] space-y-4'>
				<h2 className='text-xl font-semibold'>{t.notFoundTitle}</h2>
				<Button onClick={() => router.back()}>{t.back}</Button>
			</div>
		)
	}

	const handleStatusChange = (
		newStatus: StatusEnum,
		reason?: string,
		variantId?: string,
		criteriaId?: string,
		bonusCriteriaId?: string | null,
		totalPoints?: number,
	) => {
		setIsStatusSheetOpen(false)

		const toastId = `award-${award.id}-status-update-${newStatus}`
		const payloadTotalPoints = newStatus === StatusEnum.APPROVED ? totalPoints || 0 : 0
		const payloadReason = newStatus === StatusEnum.REJECTED ? reason || '' : ''

		toast.loading(t.toastStatusLoading, { id: toastId })

		const updateStatusPayload: IUpdateStatusRequest = {
			id: award.id,
			status: newStatus,
			reason: payloadReason,
			variant: variantId,
			criteria: criteriaId,
			bonusCriteria: newStatus === StatusEnum.APPROVED ? (bonusCriteriaId ?? '') : undefined,
			totalPoints: payloadTotalPoints,
		}

		updateStatusMutation.mutate(updateStatusPayload, {
			onSuccess: () => {
				toast.success(t.toastStatusSuccess, { id: toastId })
				refetch()
			},
			onError: (err) => {
				toast.error(t.toastStatusError, { id: toastId, description: err.message })
			},
		})
	}

	const handleDeleteAward = () => {
		setIsDeleteDialogOpen(false)

		const toastId = `award-${award.id}-delete`

		toast.loading(t.toastDeleteLoading, { id: toastId })

		deleteMutation.mutate(award.id, {
			onSuccess: () => {
				toast.success(t.toastDeleteSuccess, { id: toastId })
				router.push(backHref)
			},
			onError: (err) => {
				toast.error(t.toastDeleteError, { id: toastId, description: err.message })
			},
		})
	}

	const canFullAccess = hasPermission(user, PermissionCodeEnum.KPI_FULL)
	const isAuthor = user.keycloakId === award.teacher.keycloakId || canFullAccess
	const isMethodist = hasAnyPermission(user, [PermissionCodeEnum.KPI_MANAGE])
	const isStatusForEdit = award.status === StatusEnum.DRAFT || award.status === StatusEnum.REJECTED
	const isMethodistReview = (isMethodist || canFullAccess) && award.status === StatusEnum.IN_REVIEW

	return (
		<div className='space-y-6 p-6 w-full'>
			<PageTitle
				actions={
					<KpiDetailsActions
						id={String(id)}
						isAdmin={canFullAccess}
						isAuthor={isAuthor}
						isMethodistReview={isMethodistReview}
						isStatusForEdit={isStatusForEdit}
						onOpenApproveSheet={() => setIsApproveSheetOpen(true)}
						onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
						onOpenRejectSheet={() => setIsRejectSheetOpen(true)}
						onOpenStatusSheet={() => setIsStatusSheetOpen(true)}
						onSendToReview={() => handleStatusChange(StatusEnum.IN_REVIEW)}
					/>
				}
				backHref={backHref}
				backLabel={t.back}
				description={t.pageDescription}
			>
				{t.pageTitle}
			</PageTitle>

			<StatusInfoCard
				messages={{
					approved: t.statusApproved,
					draft: t.statusDraft,
					inReview: t.statusInReview,
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
				isOpen={isApproveSheetOpen}
				selectedBonusCriteria={selectedBonusCriteria}
				selectedCriteria={selectedCriteria}
				selectedVariant={selectedVariant}
				variantOptions={variantOptions}
				onOpenChange={setIsApproveSheetOpen}
				onStatusChange={(variantId, criteriaId, bonusCriteriaId, totalPoints) =>
					handleStatusChange(StatusEnum.APPROVED, '', variantId, criteriaId, bonusCriteriaId, totalPoints)
				}
			/>
		</div>
	)
}

export default withPermission(Page, [
	PermissionCodeEnum.KPI_FULL,
	PermissionCodeEnum.KPI_MANAGE,
	PermissionCodeEnum.KPI_VIEW,
])
