'use client'

import { useEffect, useState } from 'react'

import { notFound, useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
	Loader,
	PageTitle,
	PenaltyCard,
	PenaltySheet,
	RupsCard,
	UserCard,
	ViolationDialog,
	withPermission,
} from '@components'
import {
	getNextViolationStatus,
	getUILocaleSection,
	hasAnyPermission,
	interpolateUILocaleText,
	normalizeViolation,
} from '@helpers'
import { services } from '@services'
import {
	Button,
	ButtonGroup,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum, StatusEnum, ViolationEnum } from '@types'
import { ArrowLeft, Gavel, MoreVertical, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import uiLocale from '../../../components/ui/locale.json'
import { RupsFilterCard } from '../../rups/components'
import {
	buildRupFilterSearchParams,
	getRupFilterStateFromSearchParams,
	hasExplicitRupFilterParams,
	persistRupFilterState,
	readPersistedRupFilterState,
} from '../../rups/components/rups-filter-state'
import { UserKpiAwardsView } from './components/user-kpi-awards-view'
import { UsersPermissionsDialog } from '../users-permissions-dialog'
import localeDictionary from './locale.json'

const Page = () => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const searchParamsString = searchParams.toString()
	const params = useParams<{ id: string }>()
	const { user: me, authLoading, isAuthenticated } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const uiT = getUILocaleSection(uiLocale, locale)
	const [isPenaltySheetOpen, setIsPenaltySheetOpen] = useState(false)
	const [isViolationDialogOpen, setIsViolationDialogOpen] = useState(false)
	const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)

	const activeTabParam = searchParams.get('tab')
	const activeTab = activeTabParam === 'rups' || activeTabParam === 'kpi' ? activeTabParam : 'kpi'
	const rupsFilterStorageKey = `eduplan:users:${params.id}:rups-filters`
	const rupsFilterState = getRupFilterStateFromSearchParams(searchParams, { paramPrefix: 'rups' })
	const rupsPage = Number(searchParams.get('rupsPage')) || 1
	const rupsSearch = rupsFilterState.search
	const rupsStatus = rupsFilterState.statuses as StatusEnum[]
	const rupsSort = rupsFilterState.sort

	// queries
	const {
		data: userData,
		isLoading: userLoading,
		isError,
	} = useQuery({
		...services.user.getByIdOptions(params.id),
		enabled: !!params.id,
	})

	// rups
	const { data: rupsData, isLoading: rupsLoading } = useQuery({
		...services.rup.getAllOptions({
			currentPage: rupsPage,
			pageSize: 10,
			search: rupsSearch,
			sort: rupsSort,
			status: rupsStatus,
			teacher: params.id,
		}),
		placeholderData: keepPreviousData,
		enabled: !!params.id && !userLoading && !isError && activeTab === 'rups',
	})

	// awards grouped summary data
	const { data: kpiAwardsSummary, isLoading: kpiAwardsLoading } = useQuery({
		...services.award.getUserKpiAwardsSummaryOptions(params.id),
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

		paramsUrl.set('tab', 'rups')
		router.replace(`${pathname}?${paramsUrl.toString()}`)
	}, [activeTabParam, pathname, router, searchParams])

	useEffect(() => {
		const currentParams = new URLSearchParams(searchParams.toString())
		const currentFilterState = getRupFilterStateFromSearchParams(currentParams, { paramPrefix: 'rups' })

		if (hasExplicitRupFilterParams(currentParams, { paramPrefix: 'rups' })) {
			persistRupFilterState(currentFilterState, rupsFilterStorageKey)

			return
		}

		const persistedState = readPersistedRupFilterState(rupsFilterStorageKey)

		if (!persistedState) return

		const nextParams = buildRupFilterSearchParams(currentParams, persistedState, {
			paramPrefix: 'rups',
			resetPage: true,
		})
		const nextQuery = nextParams.toString()

		if (nextQuery === currentParams.toString()) return

		router.replace(`${pathname}?${nextQuery}`, { scroll: false })
	}, [pathname, router, rupsFilterStorageKey, searchParamsString])

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

	const canManageViolations = hasAnyPermission(me, [PermissionCodeEnum.KPI_MANAGE])
	const canManageUserPermissions = hasAnyPermission(me, [PermissionCodeEnum.KPI_FULL, PermissionCodeEnum.RUP_FULL])
	const currentViolation = userData.violation || ViolationEnum.NONE
	const nextViolation = getNextViolationStatus(currentViolation)

	const setCurrentTab = (tab: string) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('tab', tab)
		router.push(`${pathname}?${paramsUrl.toString()}`)
	}

	const setCurrentRupsPage = (newPage: number) => {
		const paramsUrl = new URLSearchParams(searchParams.toString())

		paramsUrl.set('rupsPage', String(newPage))
		router.push(`${pathname}?${paramsUrl.toString()}`, { scroll: false })
	}

	type IAction = {
		id: string
		label: string
		icon: typeof ShieldAlert
		onClick: () => void
		variant?: 'default' | 'destructive'
	}

	const actionItems: IAction[] = [
		canManageUserPermissions
			? {
					id: 'permissions',
					label: t.page.permissions,
					icon: ShieldCheck,
					onClick: () => setIsPermissionsDialogOpen(true),
				}
			: null,
		canManageViolations
			? {
					id: 'penalties',
					label: t.page.penalties,
					icon: ShieldAlert,
					onClick: () => setIsPenaltySheetOpen(true),
				}
			: null,
		canManageViolations
			? {
					id: 'violations',
					label: t.page.violations,
					icon: Gavel,
					onClick: () => setIsViolationDialogOpen(true),
				}
			: null,
	].filter((item): item is IAction => !!item)

	const visibleActions = actionItems.length > 2 ? actionItems.slice(0, 1) : actionItems
	const overflowActions = actionItems.slice(visibleActions.length)

	const renderActionButton = (action: IAction) => (
		<Button
			key={action.id}
			className={action.variant === 'destructive' ? 'hover:text-destructive' : ''}
			size='sm'
			variant='outline'
			onClick={action.onClick}
		>
			<action.icon className='mr-2 h-4 w-4' />
			{action.label}
		</Button>
	)

	const actionButtons =
		actionItems.length > 0 ? (
			<ButtonGroup className='w-full flex-wrap justify-end sm:w-auto'>
				{visibleActions.map(renderActionButton)}

				{overflowActions.length > 0 ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								aria-label={uiT.moreActions}
								className='px-3'
								size='icon-sm'
								type='button'
								variant='outline'
							>
								<MoreVertical className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-56'>
							{overflowActions.map((action) => (
								<DropdownMenuItem key={action.id} variant={action.variant} onClick={action.onClick}>
									<action.icon className='mr-2 h-4 w-4' />
									{action.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</ButtonGroup>
		) : null

	return (
		<section className='mx-auto w-full space-y-8 px-4 pb-10 pt-5'>
			<PageTitle actions={actionButtons} backHref='back' description={t.page.profileDescription}>
				{interpolateUILocaleText(t.page.title, {
					firstName: userData.firstName,
					lastName: userData.lastName,
				})}
			</PageTitle>

			<div className='grid items-stretch gap-6 lg:grid-cols-3'>
				<div className='h-full lg:col-span-2'>
					<UserCard className='h-full' showTotalPoints={true} showViolation={true} user={userData} />
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

			{canManageUserPermissions ? (
				<UsersPermissionsDialog
					defaultUserId={params.id}
					open={isPermissionsDialogOpen}
					onOpenChange={setIsPermissionsDialogOpen}
				/>
			) : null}

			<Tabs value={activeTab} onValueChange={setCurrentTab}>
				<TabsList>
					<TabsTrigger className='px-6' value='rups'>
						{t.page.rupsTab}
					</TabsTrigger>
					<TabsTrigger className='px-6' value='kpi'>
						{t.page.kpiTab}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='rups'>
					<div className='space-y-4'>
						<RupsFilterCard compact className='mb-2' paramPrefix='rups' persistKey={rupsFilterStorageKey} />

						<RupsCard
							currentPage={rupsData?.meta.currentPage || rupsPage}
							isLoading={rupsLoading}
							rups={rupsData?.data || []}
							title={t.page.rupsTitle}
							totalPages={rupsData?.meta.pages || 1}
							onPageChange={setCurrentRupsPage}
						/>
					</div>
				</TabsContent>

				<TabsContent value='kpi'>
					<UserKpiAwardsView isLoading={kpiAwardsLoading} summary={kpiAwardsSummary} userId={params.id} />
				</TabsContent>
			</Tabs>
		</section>
	)
}

export default withPermission(Page, [
	PermissionCodeEnum.RUP_FULL,
	PermissionCodeEnum.KPI_FULL,
	PermissionCodeEnum.RUP_MANAGE,
	PermissionCodeEnum.KPI_MANAGE,
])
