'use client'

import { notFound } from 'next/navigation'

import { Loader } from '@components'
import { hasRole } from '@helpers'
import { useAuthStore } from '@store'
import { RoleEnum } from '@types'

import { MethodistDashboard } from './methodist-dashboard'
import { TeacherDashboard } from './teacher-dashboard'

export default function DashboardPage() {
	const { user, authLoading } = useAuthStore()

	if (authLoading) return <Loader />
	if (!user) return notFound()

	const isMethodist = hasRole(user.role, RoleEnum.METHODIST)

	return (
		<div className='p-4 sm:p-6 lg:p-8 relative'>{isMethodist ? <MethodistDashboard /> : <TeacherDashboard />}</div>
	)
}
