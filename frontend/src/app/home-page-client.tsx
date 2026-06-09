'use client'

import Link from 'next/link'

import { PageTitle } from '@components'
import { getUILocaleSection, hasAnyPermission } from '@helpers'
import { services } from '@services'
import { Button, Card, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { PermissionCodeEnum } from '@types'
import type { LucideIcon } from 'lucide-react'
import {
	ArrowRightCircle,
	BarChart3,
	BookOpenText,
	FilePlus2,
	FileText,
	Loader2,
	LogIn,
	Shield,
	Users,
} from 'lucide-react'

import localeDictionary from './locale.json'

const features = [
	{
		key: 'rup',
		icon: <FileText className='h-8 w-8 text-primary' />,
	},
	{
		key: 'kpi',
		icon: <BarChart3 className='h-8 w-8 text-primary' />,
	},
	{
		key: 'lesson',
		icon: <FileText className='h-8 w-8 text-primary' />,
	},
]

const HomePageClient = () => {
	const { authLoading, isAuthenticated, user } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const quickActions = [
		hasAnyPermission(user, [PermissionCodeEnum.RUP_VIEW]) && {
			href: '/rups/my',
			label: t.quickActions.myRups,
			icon: FileText,
		},
		hasAnyPermission(user, [PermissionCodeEnum.RUP_MANAGE]) && {
			href: '/rups/create',
			label: t.quickActions.createRup,
			icon: FilePlus2,
		},
		hasAnyPermission(user, [PermissionCodeEnum.KPI_VIEW]) && {
			href: '/kpi/my',
			label: t.quickActions.myKpi,
			icon: BarChart3,
		},
		hasAnyPermission(user, [PermissionCodeEnum.KPI_MANAGE]) && {
			href: '/kpi/all',
			label: t.quickActions.allKpi,
			icon: BarChart3,
		},
		hasAnyPermission(user, [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL]) && {
			href: '/departments',
			label: t.quickActions.departments,
			icon: Shield,
		},
		hasAnyPermission(user, [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL]) && {
			href: '/users',
			label: t.quickActions.users,
			icon: Users,
		},
		hasAnyPermission(user, [PermissionCodeEnum.RUP_VIEW, PermissionCodeEnum.KPI_VIEW]) && {
			href: '/rups/guides',
			label: t.quickActions.guide,
			icon: BookOpenText,
		},
	].filter(Boolean) as Array<{ href: string; label: string; icon: LucideIcon }>

	return (
		<section className='relative mx-auto flex w-full max-w-7xl flex-col overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12'>
			<div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
				<div className='absolute -left-16 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl' />
				<div className='absolute right-0 top-24 h-72 w-72 rounded-full bg-chart-1/10 blur-3xl' />
				<div className='absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-chart-3/10 blur-3xl' />
				<div className='absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_24px,rgba(148,163,184,0.07)_25px),linear-gradient(to_bottom,transparent_0,transparent_24px,rgba(148,163,184,0.07)_25px)] bg-[size:25px_25px] opacity-40' />
			</div>

			<PageTitle description={t.pageDescription}>SmartPlan</PageTitle>

			<div className='mt-6 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm ring-1 ring-border/20 backdrop-blur-sm transition-all duration-300 hover:shadow-lg sm:p-6 lg:p-8'>
				<div className='flex flex-col gap-6'>
					<div className='max-w-3xl space-y-4'>
						<div className='inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary'>
							<span className='h-2 w-2 rounded-full bg-primary' />
							{t.heroEyebrow}
						</div>
						<p className='text-balance text-sm leading-7 text-muted-foreground sm:text-base'>
							{t.heroDescription}
						</p>
					</div>

					<div className='flex flex-col gap-3 sm:flex-row'>
						{authLoading ? (
							<Button disabled className='w-full sm:w-auto transition-all duration-200' size='lg'>
								<Loader2 className='h-4 w-4 animate-spin' />
								{t.actions.loading}
							</Button>
						) : isAuthenticated ? (
							<Button
								asChild
								className='w-full sm:w-auto transition-all duration-200 hover:translate-y-[-1px]'
								size='lg'
							>
								<Link href='/dashboard'>
									{t.actions.goDashboard}
									<ArrowRightCircle className='h-4 w-4' />
								</Link>
							</Button>
						) : (
							<Button
								className='w-full sm:w-auto transition-all duration-200 hover:translate-y-[-1px]'
								size='lg'
								onClick={() => services.auth.redirectToLogin()}
							>
								{t.actions.login}
								<LogIn className='h-4 w-4' />
							</Button>
						)}
					</div>

					<div className='flex flex-wrap gap-2'>
						{t.tags.map((item) => (
							<span
								key={item}
								className='rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-foreground'
							>
								{item}
							</span>
						))}
					</div>
				</div>
			</div>

			{isAuthenticated && quickActions.length > 0 && (
				<div className='mt-6 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm ring-1 ring-border/20 backdrop-blur-sm'>
					<div className='flex items-center justify-between gap-3'>
						<div>
							<p className='text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground'>
								{t.quickActions.eyebrow}
							</p>
							<h2 className='mt-1 text-lg font-semibold'>{t.quickActions.title}</h2>
						</div>
					</div>

					<div className='mt-4 flex flex-wrap gap-3'>
						{quickActions.map((action) => {
							const ActionIcon = action.icon

							return (
								<Button
									key={action.href}
									asChild
									className='h-10 rounded-full border-border/60 bg-background/80 px-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5 hover:text-primary'
									variant='outline'
								>
									<Link href={action.href}>
										<ActionIcon className='h-4 w-4' />
										{action.label}
									</Link>
								</Button>
							)
						})}
					</div>
				</div>
			)}

			<div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
				{features.map((feature) => {
					const featureLocale = t.features[feature.key]

					return (
						<div key={feature.key} className='h-full'>
							<Card className='group h-full overflow-hidden border-border/60 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg'>
								<div className='h-1 w-full bg-gradient-to-r from-primary/60 via-chart-1/40 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100' />
								<CardHeader className='flex flex-row items-start gap-4 p-5 sm:p-6'>
									<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-105'>
										{feature.icon}
									</div>
									<div className='grid gap-1'>
										<CardTitle className='text-base sm:text-lg'>{featureLocale.title}</CardTitle>
										<CardDescription className='text-sm leading-6'>
											{featureLocale.description}
										</CardDescription>
									</div>
								</CardHeader>
							</Card>
						</div>
					)
				})}
			</div>
		</section>
	)
}

export default HomePageClient
