'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@lib'
import { Button } from '@shadcn'
import { BarChart3, Building2, Crown } from 'lucide-react'

interface IRatingNavLabels {
	top20: string
	departments: string
	stats: string
}

interface IRatingNavProps {
	labels: IRatingNavLabels
	className?: string
}

const navItems = [
	{ href: '/kpi/rating', key: 'top20', icon: Crown },
	{ href: '/kpi/rating/departments', key: 'departments', icon: Building2 },
	{ href: '/kpi/rating/stats', key: 'stats', icon: BarChart3 },
] as const

export const RatingNav = ({ labels, className }: IRatingNavProps) => {
	const pathname = usePathname()

	return (
		<div className={cn('flex flex-wrap gap-2', className)}>
			{navItems.map((item) => {
				const Icon = item.icon
				const isActive = pathname === item.href
				const label = labels[item.key]

				return (
					<Button key={item.href} asChild size='sm' variant={isActive ? 'default' : 'outline'}>
						<Link aria-current={isActive ? 'page' : undefined} href={item.href}>
							<Icon className='mr-2 h-4 w-4' />
							{label}
						</Link>
					</Button>
				)
			})}
		</div>
	)
}
