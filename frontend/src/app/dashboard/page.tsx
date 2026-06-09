'use client'

import { Forbidden, withNavAccess } from '@components'
import { hasRole } from '@helpers'
import { useAuthStore } from '@store'
import { RoleEnum } from '@types'

import { MethodistDashboard } from './methodist-dashboard'
import { TeacherDashboard } from './teacher-dashboard'

const Page = () => {
	const { user } = useAuthStore()

	if (!user) {
		return <Forbidden />
	}

	const isMethodist = hasRole(user.role, RoleEnum.METHODIST)

	return isMethodist ? <MethodistDashboard /> : <TeacherDashboard keycloakId={user.keycloakId} />
}

export default withNavAccess(Page)
