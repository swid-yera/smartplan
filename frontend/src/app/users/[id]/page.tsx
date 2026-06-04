'use client'

import { useEffect, useState } from 'react'

import { notFound, useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
	AwardsCard,
	Loader,
	PageTitle,
	Pagination,
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
import { RoleEnum, type StatusEnum, ViolationEnum } from '@types'
import { ArrowLeft, Gavel, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { AwardFilterCard } from '../../kpi/components'
import localeDictionary from './locale.json'

const Page = () => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const params = useParams<{ id: string }>()
	const { user: me, authLoading, isAuthenticated } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [isPenaltySheetOpen, setIsPenaltySheetOpen] = useState(false)
	const [isViolationDialogOpen, setIsViolationDialogOpen] = useState(false)

	const activeTabParam = searchParams.get('tab')
	const activeTab =
		activeTabParam === 'created' || activeTabParam === 'assessment' || activeTabParam === 'kpi'
			? activeTabParam
			: 'kpi'

	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10
	const statusParam = searchParams.get('status') ?? ''
	const categoryIdParam = searchParams.get('categoryId') ?? ''
	const sortParam = searchParams.get('sort')

	const status = statusParam ? statusParam.split(',') : undefined
	const sort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : 'desc'
	const categoryId = categoryIdParam
		? categoryIdParam
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean)
		: undefined

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
		...services.award.getAllOptions({
			categoryId,
			currentPage: page,
			pageSize,
			sort,
			status: status as StatusEnum[],
			teacher: params.id,
		}),
		enabled: !!params.id && !!userData && !isError && activeTab === 'kpi',
	})

	// penalties data
	const { data: penaltiesData = [], isLoading: penaltiesLoading } = useQuery({
		...services.user.getAllPenaltiesByTeacherIdOptions(params.id),
		enabled: !userLoading && !isError && !!params.id,
	})

	const createViolationMutation = useMutation(services.user.createViolationOptions(params.id))
	const deleteViolationMutation = useMutation(services.user.deleteViolationOptions(params.id))

	useEffect(() => {
		if (activeTabParam) return

		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('tab', 'kpi')
		router.replace(`${pathname}?${paramsUrl.toString()}`)
	}, [activeTabParam, pathname, router, searchParams])

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

	const isMethodistView = hasRole(me.role, RoleEnum.METHODIST, true)
	const currentViolation = userData.violation || ViolationEnum.NONE
	const nextViolation = getNextViolationStatus(currentViolation)
	const pageTitleDescription = activeTab === 'kpi' ? t.page.kpiProfileDescription : undefined

	const setCurrentTab = (tab: string) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('tab', tab)
		router.push(`${pathname}?${paramsUrl.toString()}`)
	}

	const setCurrentPage = (newPage: number) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('page', String(newPage))
		router.push(`${pathname}?${paramsUrl.toString()}`)
	}

	const setPageSize = (newSize: number) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('pageSize', String(newSize))
		paramsUrl.set('page', '1')
		router.push(`${pathname}?${paramsUrl.toString()}`)
	}

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
		<section className='mx-auto w-full space-y-8 px-4 pb-10 pt-5'>
			<PageTitle actions={actionButtons} backHref='/users' description={pageTitleDescription}>
				{interpolateUILocaleText(t.page.title, {
					firstName: userData.firstName,
					lastName: userData.lastName,
				})}
			</PageTitle>

			<div className='grid items-stretch gap-6 lg:grid-cols-3'>
				<div className='h-full lg:col-span-2'>
					<UserCard
						className='h-full'
						showTotalPoints={activeTab === 'kpi'}
						showViolation={activeTab !== 'kpi'}
						user={userData}
					/>
				</div>
				<div className='flex h-full min-h-0 flex-col lg:col-span-1'>
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

			<Tabs value={activeTab} onValueChange={setCurrentTab}>
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
					<div className='space-y-4'>
						<AwardFilterCard compact className='mb-2' />

						<AwardsCard
							awards={awardsData?.data || []}
							currentPage={awardsData?.meta.currentPage || 1}
							description={t.page.kpiListDescription}
							isLoading={awardsLoading}
							showPointsColumn={false}
							title={t.page.kpiListTitle}
							totalPages={awardsData?.meta.pages || 1}
							onPageChange={setCurrentPage}
						/>

						<Pagination
							page={awardsData?.meta.currentPage || 1}
							pageSize={awardsData?.meta.pageSize || 10}
							pageSizeOptions={[10, 20, 50]}
							totalPages={awardsData?.meta.pages || 1}
							onPageChange={setCurrentPage}
							onPageSizeChange={setPageSize}
						/>
					</div>
				</TabsContent>
			</Tabs>
		</section>
	)
}

export default Page
