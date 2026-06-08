'use client'

import { notFound } from 'next/navigation'

import { Loader, withRole } from '@components'
import { hasRole } from '@helpers'
import { useAuthStore } from '@store'
import { RoleEnum } from '@types'

import { MethodistDashboard } from './methodist-dashboard'
import { TeacherDashboard } from './teacher-dashboard'

function DashboardPage() {
	const { user, authLoading } = useAuthStore()

	if (authLoading) return <Loader />
	if (!user) return notFound()

	const isMethodist = hasRole(user.role, RoleEnum.METHODIST)

	return isMethodist ? <MethodistDashboard /> : <TeacherDashboard keycloakId={user.keycloakId} />
}

export default withRole(DashboardPage, [RoleEnum.TEACHER, RoleEnum.METHODIST])
