'use client'

import { Heading } from '@ui'

import { ExportStatus } from './export-status'
import { QuickActions } from './quick-actions'
import { RecentActivities } from './recent-activities'
import { RecentRUPs } from './recent-rups'
import { StatsCards } from './stats-cards'
import { SystemHealth } from './system-health'

const Page = () => {
	return (
		<div className='container mx-auto p-6 max-w-7xl space-y-8'>
			{/* Header */}
			<div>
				<Heading align='left' className='text-3xl font-bold' size='h2'>
					Панель управления
				</Heading>
				<p className='text-muted-foreground mt-2'>
					Добро пожаловать в систему управления учебными планами. Здесь вы можете отслеживать все активности и
					управлять РУП.
				</p>
			</div>

			{/* Statistics Cards */}
			<StatsCards />

			{/* Main Content Grid */}
			<div className='grid gap-6 lg:grid-cols-2'>
				<RecentActivities />
				<QuickActions />
				<RecentRUPs />
				<ExportStatus />
				<SystemHealth />
			</div>
		</div>
	)
}

export default Page
