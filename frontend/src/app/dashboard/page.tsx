'use client'

import type { FC } from 'react'

import Link from 'next/link'

import { AwardsCard, Forbidden, PageTitle, RupsCard, withNavAccess } from '@components'
import { getUILocaleSection, hasAnyPermission, hasPermission } from '@helpers'
import { services } from '@services'
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQueries } from '@tanstack/react-query'
import { PermissionCodeEnum, RoleEnum, StatusEnum } from '@types'
import {
	Award,
	BookOpen,
	ClipboardClock,
	FilePlus,
	Group,
	LibraryBig,
	type LucideIcon,
	Settings2,
	ShieldCheck,
	Users,
	UsersRound,
} from 'lucide-react'

import localeDictionary from './locale.json'

type QuickAction = {
	label: string
	href: string
	icon: LucideIcon
	variant?: 'default' | 'secondary' | 'outline'
}

const recentQueryParams = { currentPage: 1, pageSize: 5, sort: 'desc' as const }
const reviewQueryParams = { currentPage: 1, pageSize: 5, sort: 'desc' as const, status: [StatusEnum.IN_REVIEW] }

const Page = () => {
	const { user } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).dashboard

	if (!user) {
		return <Forbidden />
	}

	const canViewRup = hasAnyPermission(user, [PermissionCodeEnum.RUP_VIEW])
	const canManageRup = hasAnyPermission(user, [PermissionCodeEnum.RUP_MANAGE])
	const canFullRup = hasPermission(user, PermissionCodeEnum.RUP_FULL)
	const canViewKpi = hasAnyPermission(user, [PermissionCodeEnum.KPI_VIEW])
	const canManageKpi = hasAnyPermission(user, [PermissionCodeEnum.KPI_MANAGE])
	const canFullKpi = hasPermission(user, PermissionCodeEnum.KPI_FULL)
	const canUseAdminShortcuts = canFullRup || canFullKpi || canManageKpi || user.role === RoleEnum.ADMIN

	const [recentRupsQuery, reviewRupsQuery, recentKpiQuery, reviewKpiQuery] = useQueries({
		queries: [
			{
				...services.rup.getAllOptions({
					...recentQueryParams,
					...(canManageRup || canFullRup ? {} : { teacher: user.keycloakId }),
				}),
				enabled: canViewRup || canFullRup,
			},
			{
				...services.rup.getAllOptions(reviewQueryParams),
				enabled: canManageRup || canFullRup,
			},
			{
				...services.award.getAllOptions({
					...recentQueryParams,
					...(canManageKpi || canFullKpi ? {} : { teacher: user.keycloakId }),
				}),
				enabled: canViewKpi || canFullKpi,
			},
			{
				...services.award.getAllOptions(reviewQueryParams),
				enabled: canManageKpi || canFullKpi,
			},
		],
	})

	const recentRups = recentRupsQuery.data?.data ?? []
	const reviewRups = reviewRupsQuery.data?.data ?? []
	const recentAwards = recentKpiQuery.data?.data ?? []
	const reviewAwards = reviewKpiQuery.data?.data ?? []

	const rupList = canManageRup || canFullRup ? reviewRups : recentRups
	const awardList = canManageKpi || canFullKpi ? reviewAwards : recentAwards

	const rupReviewCount = reviewRupsQuery.data?.meta.total ?? 0
	const rupTotalCount = recentRupsQuery.data?.meta.total ?? 0
	const kpiReviewCount = reviewKpiQuery.data?.meta.total ?? 0
	const kpiTotalCount = recentKpiQuery.data?.meta.total ?? 0

	const rupQuickActions = buildRupActions({
		canViewRup,
		canManageRup,
		canFullRup,
	})
	const kpiQuickActions = buildKpiActions({
		canViewKpi,
		canManageKpi,
		canFullKpi,
	})
	const adminQuickActions = canUseAdminShortcuts ? buildAdminActions(t.kpiUploadLock) : []
	const hasRupTab = canViewRup || canManageRup || canFullRup
	const hasKpiTab = canViewKpi || canManageKpi || canFullKpi
	const visibleTabs = [hasRupTab ? 'rup' : null, hasKpiTab ? 'kpi' : null].filter(
		(tab): tab is 'rup' | 'kpi' => tab !== null,
	)
	const defaultTab = visibleTabs[0] ?? 'rup'
	const rupTabCount = canManageRup || canFullRup ? rupReviewCount : rupTotalCount
	const kpiTabCount = canManageKpi || canFullKpi ? kpiReviewCount : kpiTotalCount
	const quickGroups = [
		hasRupTab && {
			key: 'rup' as const,
			title: t.rupTitle,
			description: canManageRup || canFullRup ? t.rupDescriptionManage : t.rupDescriptionView,
			meta:
				canManageRup || canFullRup
					? `${t.reviewLabel}: ${rupReviewCount} · ${t.totalLabel}: ${rupTotalCount}`
					: `${t.totalLabel}: ${rupTotalCount}`,
			icon: BookOpen,
			actions: rupQuickActions,
		},
		hasKpiTab && {
			key: 'kpi' as const,
			title: t.kpiTitle,
			description: canManageKpi || canFullKpi ? t.kpiDescriptionManage : t.kpiDescriptionView,
			meta:
				canManageKpi || canFullKpi
					? `${t.reviewLabel}: ${kpiReviewCount} · ${t.totalLabel}: ${kpiTotalCount}`
					: `${t.totalLabel}: ${kpiTotalCount}`,
			icon: Award,
			actions: kpiQuickActions,
		},
		canUseAdminShortcuts && {
			key: 'admin' as const,
			title: t.adminTitle,
			description: t.adminDescription,
			meta: t.adminMeta,
			icon: ShieldCheck,
			actions: adminQuickActions,
		},
	].filter(Boolean) as Array<{
		key: 'rup' | 'kpi' | 'admin'
		title: string
		description: string
		meta: string
		icon: LucideIcon
		actions: QuickAction[]
	}>

	const quickGridClass =
		quickGroups.length === 1 ? 'lg:grid-cols-1' : quickGroups.length === 2 ? 'lg:grid-cols-2' : 'xl:grid-cols-3'

	return (
		<section className='space-y-6 px-4 pt-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<div className='space-y-3'>
				<div className='space-y-1'>
					<p className='text-sm font-medium'>{t.quickTitle}</p>
					<p className='text-sm text-muted-foreground'>{t.quickDescription}</p>
				</div>

				<div className={`grid gap-4 ${quickGridClass}`}>
					{quickGroups.map((group) => (
						<QuickActionGroup
							key={group.key}
							actions={group.actions}
							description={group.description}
							icon={group.icon}
							meta={group.meta}
							title={group.title}
							tone={group.key}
						/>
					))}
				</div>
			</div>

			{visibleTabs.length > 0 ? (
				<Tabs className='space-y-4' defaultValue={defaultTab}>
					<TabsList className={`grid w-full ${visibleTabs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:w-fit`}>
						{hasRupTab ? (
							<TabsTrigger className='px-4' value='rup'>
								<span>{t.rupTitle}</span>
								<Badge className='ml-1.5 h-5 min-w-5 px-1.5 text-[10px]' variant='secondary'>
									{rupTabCount}
								</Badge>
							</TabsTrigger>
						) : null}
						{hasKpiTab ? (
							<TabsTrigger className='px-4' value='kpi'>
								<span>{t.kpiTitle}</span>
								<Badge className='ml-1.5 h-5 min-w-5 px-1.5 text-[10px]' variant='secondary'>
									{kpiTabCount}
								</Badge>
							</TabsTrigger>
						) : null}
					</TabsList>

					{hasRupTab ? (
						<TabsContent className='mt-0' value='rup'>
							<RupsCard
								showCreateOnEmpty
								className='h-full'
								currentPage={1}
								description={canManageRup || canFullRup ? t.rupDescriptionManage : t.rupDescriptionView}
								isLoading={canManageRup || canFullRup ? reviewRupsQuery.isLoading : recentRupsQuery.isLoading}
								rups={rupList}
								title={canManageRup || canFullRup ? t.reviewRupsTitle : t.myRupsTitle}
								totalPages={1}
								onPageChange={() => undefined}
							/>
						</TabsContent>
					) : null}

					{hasKpiTab ? (
						<TabsContent className='mt-0' value='kpi'>
							<AwardsCard
								showCreateOnEmpty
								awards={awardList}
								description={canManageKpi || canFullKpi ? t.kpiDescriptionManage : t.kpiDescriptionView}
								isLoading={canManageKpi || canFullKpi ? reviewKpiQuery.isLoading : recentKpiQuery.isLoading}
								title={canManageKpi || canFullKpi ? t.reviewKpiTitle : t.myKpiTitle}
							/>
						</TabsContent>
					) : null}
				</Tabs>
			) : null}
		</section>
	)
}

export default withNavAccess(Page)

interface IQuickActionGroupProps {
	title: string
	description: string
	meta: string
	icon: LucideIcon
	actions: QuickAction[]
	tone: 'rup' | 'kpi' | 'admin'
}

const quickToneStyles = {
	rup: {
		accent: 'var(--chart-1)',
		border: 'color-mix(in oklch, var(--chart-1) 24%, var(--border))',
		background: 'color-mix(in oklch, var(--chart-1) 8%, var(--background))',
		tint: 'color-mix(in oklch, var(--chart-1) 10%, transparent)',
	},
	kpi: {
		accent: 'var(--chart-2)',
		border: 'color-mix(in oklch, var(--chart-2) 24%, var(--border))',
		background: 'color-mix(in oklch, var(--chart-2) 8%, var(--background))',
		tint: 'color-mix(in oklch, var(--chart-2) 10%, transparent)',
	},
	admin: {
		accent: 'var(--chart-3)',
		border: 'color-mix(in oklch, var(--chart-3) 24%, var(--border))',
		background: 'color-mix(in oklch, var(--chart-3) 8%, var(--background))',
		tint: 'color-mix(in oklch, var(--chart-3) 10%, transparent)',
	},
} as const

const QuickActionGroup: FC<IQuickActionGroupProps> = ({ title, description, meta, icon: Icon, actions, tone }) => {
	if (!actions.length) return null
	const theme = quickToneStyles[tone]
	const actionGridClass = actions.length <= 1 ? 'grid-cols-1' : 'sm:grid-cols-2'

	return (
		<div
			className='overflow-hidden rounded-2xl border p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5'
			style={{
				background: theme.background,
				borderColor: theme.border,
			}}
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='space-y-1'>
					<div className='flex items-center gap-2'>
						<span
							className='flex h-8 w-8 items-center justify-center rounded-lg'
							style={{
								background: theme.tint,
								color: theme.accent,
							}}
						>
							<Icon className='h-4 w-4' />
						</span>
						<p className='text-sm font-semibold'>{title}</p>
					</div>
					<p className='text-xs text-muted-foreground'>{description}</p>
				</div>
			</div>

			<p className='mt-3 text-xs text-muted-foreground'>{meta}</p>

			<div className={`mt-4 grid gap-2 ${actionGridClass}`}>
				{actions.map((action) => (
					<Button key={action.href} asChild className='justify-start gap-2' size='sm' variant={action.variant}>
						<Link href={action.href}>
							<action.icon className='h-4 w-4' />
							<span className='truncate'>{action.label}</span>
						</Link>
					</Button>
				))}
			</div>
		</div>
	)
}

const buildRupActions = ({
	canViewRup,
	canManageRup,
	canFullRup,
}: {
	canViewRup: boolean
	canManageRup: boolean
	canFullRup: boolean
}): QuickAction[] => {
	const actions: QuickAction[] = []

	if (canViewRup || canFullRup) {
		actions.push(
			{ label: 'Мои РУП', href: '/rups/my', icon: LibraryBig, variant: 'secondary' },
			{ label: 'Создать РУП', href: '/rups/create', icon: FilePlus, variant: 'default' },
		)
	}

	if (canManageRup || canFullRup) {
		actions.push(
			{ label: 'Проверка РУП', href: '/rups/review', icon: ClipboardClock, variant: 'outline' },
			{ label: 'Все РУП', href: '/rups/all', icon: BookOpen, variant: 'outline' },
		)
	}

	return actions
}

const buildKpiActions = ({
	canViewKpi,
	canManageKpi,
	canFullKpi,
}: {
	canViewKpi: boolean
	canManageKpi: boolean
	canFullKpi: boolean
}): QuickAction[] => {
	const actions: QuickAction[] = []

	if (canViewKpi || canFullKpi) {
		actions.push(
			{ label: 'Мои KPI', href: '/kpi/my', icon: Award, variant: 'secondary' },
			{ label: 'Создать KPI', href: '/kpi/entry', icon: FilePlus, variant: 'default' },
		)
	}

	if (canManageKpi || canFullKpi) {
		actions.push(
			{ label: 'Проверка KPI', href: '/kpi/all', icon: ClipboardClock, variant: 'outline' },
			{ label: 'Рейтинг KPI', href: '/kpi/rating', icon: Settings2, variant: 'outline' },
		)
	}

	return actions
}

const buildAdminActions = (kpiUploadLockLabel: string): QuickAction[] => [
	{ label: 'Пользователи', href: '/users', icon: Users, variant: 'default' },
	{ label: 'Группы', href: '/groups', icon: Group, variant: 'outline' },
	{ label: 'Отделения', href: '/departments', icon: UsersRound, variant: 'outline' },
	{ label: kpiUploadLockLabel, href: '/admin/kpi-upload-lock', icon: ShieldCheck, variant: 'outline' },
]
