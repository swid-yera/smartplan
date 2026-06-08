import type { FC } from 'react'

import Link from 'next/link'

import { Forbidden, PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { getServerAuthUser, getServerLocale } from '@lib/server'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import {
	ArrowRight,
	BadgeCheck,
	BarChart3,
	Building2,
	Clock3,
	FileInput,
	Gauge,
	ListChecks,
	type LucideIcon,
	Medal,
	ShieldCheck,
	SlidersHorizontal,
	Sparkles,
	Target,
	Users,
} from 'lucide-react'

import localeDictionary from './locale.json'

const PRINCIPLES = [
	{ icon: Target, key: 'goal' },
	{ icon: Gauge, key: 'measurable' },
	{ icon: Sparkles, key: 'actionable' },
	{ icon: Clock3, key: 'timeBound' },
] as const

const FLOW_STEPS = [
	{ icon: FileInput, key: 'entry' },
	{ icon: ShieldCheck, key: 'review' },
	{ icon: BarChart3, key: 'rating' },
	{ icon: ListChecks, key: 'settings' },
] as const

const ROUTE_GROUPS = [
	{ key: 'teacher', items: ['entry', 'my'] },
	{ key: 'methodist', items: ['all', 'rating', 'departments', 'stats'] },
	{ key: 'admin', items: ['categories', 'types'] },
] as const

const ROUTES = {
	entry: { href: '/kpi/entry', icon: FileInput, role: 'teacher' },
	my: { href: '/kpi/my', icon: Medal, role: 'teacher' },
	all: { href: '/kpi/all', icon: Users, role: 'methodist' },
	rating: { href: '/kpi/rating', icon: BarChart3, role: 'methodist' },
	departments: { href: '/kpi/rating/departments', icon: Building2, role: 'methodist' },
	stats: { href: '/kpi/rating/stats', icon: BadgeCheck, role: 'methodist' },
	categories: { href: '/kpi/categories', icon: ListChecks, role: 'admin' },
	types: { href: '/kpi/types', icon: SlidersHorizontal, role: 'admin' },
} as const

const CRITERIA_TYPES = [{ key: 'fixed' }, { key: 'range' }] as const

export default async function Page() {
	const [locale, user] = await Promise.all([getServerLocale(), getServerAuthUser()])

	if (!user) {
		return <Forbidden />
	}

	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<section className='mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6'>
			<PageTitle sticky backHref='/dashboard' description={t.pageDescription}>
				{t.pageTitle}
			</PageTitle>

			<Card className='overflow-hidden border-primary/15 bg-linear-to-br from-primary/8 via-background to-background'>
				<CardHeader className='space-y-4'>
					<Badge className='w-fit rounded-full px-3 py-1' variant='secondary'>
						{t.heroEyebrow}
					</Badge>

					<div className='space-y-3'>
						<CardTitle className='max-w-3xl text-3xl tracking-tight sm:text-4xl'>{t.heroTitle}</CardTitle>
						<CardDescription className='max-w-3xl text-base leading-7'>{t.heroDescription}</CardDescription>
					</div>
				</CardHeader>

				<CardContent className='flex flex-col gap-4'>
					<p className='text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground'>{t.heroFlow}</p>

					<div className='flex flex-wrap gap-2'>
						{t.heroTags.map((tag) => (
							<Badge key={tag} className='rounded-full px-3 py-1' variant='outline'>
								{tag}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			<section className='space-y-4'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>{t.principlesTitle}</h2>
					<p className='text-sm text-muted-foreground'>{t.principlesDescription}</p>
				</div>

				<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
					{PRINCIPLES.map((item) => (
						<PrincipleCard
							key={item.key}
							description={t.principles[item.key].description}
							icon={item.icon}
							title={t.principles[item.key].title}
						/>
					))}
				</div>
			</section>

			<section className='space-y-4'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>{t.comparisonTitle}</h2>
					<p className='text-sm text-muted-foreground'>{t.comparisonDescription}</p>
				</div>

				<Card className='border-border/60'>
					<CardContent className='p-5 sm:p-6'>
						<div className='grid gap-4 md:grid-cols-2'>
							<div className='rounded-2xl border border-primary/15 bg-primary/5 p-5'>
								<Badge className='w-fit rounded-full px-3 py-1 text-primary' variant='secondary'>
									{t.comparison.kpi.label}
								</Badge>
								<h3 className='mt-3 text-lg font-semibold'>{t.comparison.kpi.title}</h3>
								<p className='mt-2 text-sm leading-6 text-muted-foreground'>{t.comparison.kpi.description}</p>
							</div>

							<div className='rounded-2xl border border-border/60 bg-muted/35 p-5'>
								<Badge className='w-fit rounded-full px-3 py-1' variant='outline'>
									{t.comparison.metric.label}
								</Badge>
								<h3 className='mt-3 text-lg font-semibold'>{t.comparison.metric.title}</h3>
								<p className='mt-2 text-sm leading-6 text-muted-foreground'>
									{t.comparison.metric.description}
								</p>
							</div>
						</div>

						<p className='mt-4 text-sm leading-6 text-muted-foreground'>{t.comparison.note}</p>
					</CardContent>
				</Card>
			</section>

			<section className='space-y-4'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>{t.flowTitle}</h2>
					<p className='text-sm text-muted-foreground'>{t.flowDescription}</p>
				</div>

				<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
					{FLOW_STEPS.map((item) => (
						<MiniCard
							key={item.key}
							description={t.flow[item.key].description}
							icon={item.icon}
							title={t.flow[item.key].title}
						/>
					))}
				</div>
			</section>

			<section className='space-y-4'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>{t.criteriaTitle}</h2>
					<p className='text-sm text-muted-foreground'>{t.criteriaDescription}</p>
				</div>

				<Card className='border-border/60'>
					<CardContent className='space-y-5 p-5 sm:p-6'>
						<p className='max-w-4xl text-sm leading-6 text-muted-foreground'>{t.criteriaNote}</p>

						<div className='grid gap-4 md:grid-cols-2'>
							{CRITERIA_TYPES.map((item) => (
								<div key={item.key} className='rounded-2xl border border-border/60 bg-muted/25 p-5'>
									<Badge className='w-fit rounded-full px-3 py-1' variant='secondary'>
										{t.criteriaTypes[item.key].title}
									</Badge>
									<p className='mt-3 text-sm leading-6 text-muted-foreground'>
										{t.criteriaTypes[item.key].description}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</section>

			<section className='space-y-4'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>{t.routesTitle}</h2>
					<p className='text-sm text-muted-foreground'>{t.routesDescription}</p>
				</div>

				<div className='space-y-5'>
					{ROUTE_GROUPS.map((group) => (
						<Card key={group.key} className='border-border/60'>
							<CardHeader className='space-y-1'>
								<CardTitle className='text-lg'>{t.routeGroups[group.key].title}</CardTitle>
								<CardDescription>{t.routeGroups[group.key].description}</CardDescription>
							</CardHeader>

							<CardContent className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
								{group.items.map((routeKey) => (
									<RouteCard
										key={routeKey}
										ctaLabel={t.open}
										description={t.routes[routeKey].description}
										href={ROUTES[routeKey].href}
										icon={ROUTES[routeKey].icon}
										roleLabel={t.roles[ROUTES[routeKey].role]}
										title={t.routes[routeKey].title}
									/>
								))}
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Card className='border-dashed border-border/60'>
				<CardContent className='p-5 sm:p-6'>
					<p className='text-sm leading-6 text-muted-foreground'>{t.footerNote}</p>
					<p className='mt-2 text-sm leading-6 text-muted-foreground'>{t.footerHint}</p>
				</CardContent>
			</Card>
		</section>
	)
}

interface IPrincipleCardProps {
	description: string
	icon: LucideIcon
	title: string
}

const PrincipleCard: FC<IPrincipleCardProps> = ({ description, icon: Icon, title }) => {
	return (
		<Card className='h-full border-border/60 bg-card/80 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md'>
			<CardContent className='p-5'>
				<div className='mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
					<Icon className='h-5 w-5' />
				</div>
				<h3 className='text-base font-semibold'>{title}</h3>
				<p className='mt-2 text-sm leading-6 text-muted-foreground'>{description}</p>
			</CardContent>
		</Card>
	)
}

interface IMiniCardProps {
	description: string
	icon: LucideIcon
	title: string
}

const MiniCard: FC<IMiniCardProps> = ({ description, icon: Icon, title }) => {
	return (
		<Card className='h-full border-border/60 bg-card/80 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md'>
			<CardContent className='p-5'>
				<div className='mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground'>
					<Icon className='h-5 w-5' />
				</div>
				<h3 className='text-base font-semibold'>{title}</h3>
				<p className='mt-2 text-sm leading-6 text-muted-foreground'>{description}</p>
			</CardContent>
		</Card>
	)
}

interface IRouteCardProps {
	ctaLabel: string
	description: string
	href: string
	icon: LucideIcon
	roleLabel: string
	title: string
}

const RouteCard: FC<IRouteCardProps> = ({ ctaLabel, description, href, icon: Icon, roleLabel, title }) => {
	return (
		<Link className='group block h-full' href={href}>
			<Card className='h-full border-border/60 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md'>
				<CardContent className='flex h-full flex-col p-5'>
					<div className='flex items-start justify-between gap-3'>
						<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
							<Icon className='h-5 w-5' />
						</div>
						<Badge className='shrink-0 rounded-full px-3 py-1 text-xs' variant='outline'>
							{roleLabel}
						</Badge>
					</div>

					<div className='mt-4 space-y-2'>
						<h3 className='text-base font-semibold'>{title}</h3>
						<p className='text-sm leading-6 text-muted-foreground'>{description}</p>
					</div>

					<div className='mt-4 flex items-center gap-2 text-sm font-medium text-primary'>
						<span>{ctaLabel}</span>
						<ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
					</div>
				</CardContent>
			</Card>
		</Link>
	)
}
