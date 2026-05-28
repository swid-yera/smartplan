'use client'

import { useState } from 'react'

import { notFound, useParams, useRouter } from 'next/navigation'

import {
	AwardsCard,
	Loader,
	PageTitle,
	PenaltyCard,
	PenaltySheet,
	RupsCard,
	UserCard,
	ViolationDialog,
} from '@components'
import {
	getNextViolationStatus,
	getUILocaleSection,
	hasRole,
	interpolateUILocaleText,
	normalizeViolation,
} from '@helpers'
import { services } from '@services'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { RoleEnum, ViolationEnum } from '@types'
import { ArrowLeft, Gavel, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

export default function UserPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const { user: me, authLoading, isAuthenticated } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [kpiPage, setKpiPage] = useState(1)
	const [isPenaltySheetOpen, setIsPenaltySheetOpen] = useState(false)
	const [isViolationDialogOpen, setIsViolationDialogOpen] = useState(false)

	// queries
	const {
		data: userData,
		isLoading: userLoading,
		isError,
	} = useQuery({
		...services.user.getByIdOptions(params.id),
		enabled: !!params.id,
	})
	// created rups
	const { data: createdRups, isLoading: createdRupsLoading } = useQuery({
		...services.rup.getAllOptions({ teacher: params.id }),
		enabled: !userLoading && !isError,
	})
	// assessment rups
	const { data: assessmentRups, isLoading: assessmentRupsLoading } = useQuery({
		...services.rup.getAllOptions({ methodist: params.id }),
		enabled: !userLoading && !isError,
	})
	// awards data
	const { data: awardsData, isLoading: awardsLoading } = useQuery({
		...services.award.getAllOptions({ currentPage: kpiPage, teacher: params.id }),
		enabled: !userLoading && !isError,
	})
	// penalties data
	const { data: penaltiesData = [], isLoading: penaltiesLoading } = useQuery({
		...services.user.getAllPenaltiesByTeacherIdOptions(params.id),
		enabled: !userLoading && !isError && !!params.id,
	})
	const createViolationMutation = useMutation(services.user.createViolationOptions(params.id))
	const deleteViolationMutation = useMutation(services.user.deleteViolationOptions(params.id))

	if (userLoading || authLoading) {
		return <Loader />
	}

	if (!isAuthenticated || !me) {
		return notFound()
	}

	if (isError || !userData) {
		return (
			<div className='container mx-auto py-10 space-y-8 max-w-7xl text-center'>
				<h2 className='text-2xl font-bold'>{t.page.notFound}</h2>
				<Button onClick={() => router.back()}>
					<ArrowLeft className='mr-2 h-4 w-4' /> {t.page.back}
				</Button>
			</div>
		)
	}

	const isTeacher = hasRole(userData.role, RoleEnum.TEACHER, false)
	const isMethodistView = hasRole(me.role, RoleEnum.METHODIST, true)
	const currentViolation = userData.violation || ViolationEnum.NONE
	const nextViolation = getNextViolationStatus(currentViolation)

	// page title action buttons
	const actionButtons = isMethodistView && (
		<div className='flex items-center gap-2'>
			<Button size='sm' variant='outline' onClick={() => setIsPenaltySheetOpen(true)}>
				<ShieldAlert className='mr-2 h-4 w-4' />
				{t.page.penalties}
			</Button>
			<Button size='sm' variant='outline' onClick={() => setIsViolationDialogOpen(true)}>
				<Gavel className='mr-2 h-4 w-4' />
				{t.page.violations}
			</Button>
		</div>
	)

	return (
		<section className='mx-auto pb-10 pt-5 px-4 space-y-8 w-full'>
			<PageTitle actions={actionButtons} backHref='/users'>
				{interpolateUILocaleText(t.page.title, {
					firstName: userData.firstName,
					lastName: userData.lastName,
				})}
			</PageTitle>

			<div className='grid items-stretch gap-6 lg:grid-cols-3'>
				<div className='lg:col-span-2 h-full'>
					<UserCard className='h-full' user={userData} />
				</div>
				<div className='lg:col-span-1 flex h-full min-h-0 flex-col'>
					<PenaltyCard className='min-h-0 flex-1' isLoading={penaltiesLoading} penalties={penaltiesData} />
				</div>
			</div>

			<PenaltySheet
				isLoading={penaltiesLoading}
				open={isPenaltySheetOpen}
				penalties={penaltiesData}
				teacherId={params.id}
				onOpenChange={setIsPenaltySheetOpen}
			/>
			<ViolationDialog
				currentStatusLabel={normalizeViolation(currentViolation, locale)}
				isMaxViolation={currentViolation === ViolationEnum.SEVERE_REPRIMAND}
				nextStatusLabel={normalizeViolation(nextViolation, locale)}
				open={isViolationDialogOpen}
				pending={createViolationMutation.isPending}
				pendingDelete={deleteViolationMutation.isPending}
				violations={userData.violations}
				onDeleteViolation={(violationId) => {
					deleteViolationMutation.mutate(violationId, {
						onSuccess: () => {
							setIsViolationDialogOpen(false)
							toast.success(t.page.violationDeleted)
						},
						onError: (error) => {
							toast.error(error.message)
						},
					})
				}}
				onOpenChange={setIsViolationDialogOpen}
				onSubmit={({ note }) => {
					createViolationMutation.mutate(
						{ note },
						{
							onSuccess: () => {
								setIsViolationDialogOpen(false)
								toast.success(t.page.violationAdded)
							},
							onError: (error) => {
								toast.error(error.message)
							},
						},
					)
				}}
			/>

			<Tabs defaultValue={isTeacher ? 'created' : 'assessment'}>
				<TabsList>
					<TabsTrigger className='px-6' value='created'>
						{t.page.createdTab}
					</TabsTrigger>
					<TabsTrigger className='px-6' value='assessment'>
						{t.page.assessmentTab}
					</TabsTrigger>
					<TabsTrigger className='px-6' value='kpi'>
						{t.page.kpiTab}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='created'>
					<RupsCard
						currentPage={createdRups?.meta.currentPage || 1}
						isLoading={createdRupsLoading}
						rups={createdRups?.data || []}
						title={t.page.createdRupsTitle}
						totalPages={createdRups?.meta.pages || 1}
						onPageChange={() => true}
					/>
				</TabsContent>

				<TabsContent value='assessment'>
					<RupsCard
						currentPage={assessmentRups?.meta.currentPage || 1}
						isLoading={assessmentRupsLoading}
						rups={assessmentRups?.data || []}
						title={t.page.assessmentRupsTitle}
						totalPages={assessmentRups?.meta.pages || 1}
						onPageChange={() => true}
					/>
				</TabsContent>

				<TabsContent value='kpi'>
					<AwardsCard
						awards={awardsData?.data || []}
						currentPage={awardsData?.meta.currentPage || 1}
						isLoading={awardsLoading}
						title={t.page.kpiTitle}
						totalPages={awardsData?.meta.pages || 1}
						onPageChange={setKpiPage}
					/>
				</TabsContent>
			</Tabs>
		</section>
	)
}
