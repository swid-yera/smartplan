'use client'

import { useState } from 'react'

import { useAuthStore } from '@store'
import { Button } from '@ui'

import { MethodistDashboard } from './methodist-dashboard'
import { TeacherDashboard } from './teacher-dashboard'

export default function DashboardPage() {
	const { user, isLoading } = useAuthStore()
	const [isMethodistOverride, setIsMethodistOverride] = useState<boolean | null>(null)

	if (isLoading) {
		return null
	}

	// В реальном приложении роль должна приходить с бэкенда в объекте user
	const isMethodist = isMethodistOverride ?? user?.roles?.includes('methodist')

	return (
		<div className='p-4 sm:p-6 lg:p-8 relative'>
			<div className='absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8'>
				<Button variant='outline' onClick={() => setIsMethodistOverride(!isMethodist)}>
					{isMethodist ? 'Teacher View' : 'Methodist View'}
				</Button>
			</div>
			{isMethodist ? <MethodistDashboard /> : <TeacherDashboard />}
		</div>
	)
}
