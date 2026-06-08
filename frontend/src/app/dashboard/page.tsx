import { Forbidden } from '@components'
import { hasRole } from '@helpers'
import { getServerAuthUser } from '@lib/server'
import { RoleEnum } from '@types'

import { MethodistDashboard } from './methodist-dashboard'
import { TeacherDashboard } from './teacher-dashboard'

export default async function DashboardPage() {
	const user = await getServerAuthUser()

	if (!user) {
		return <Forbidden />
	}

	const isMethodist = hasRole(user.role, RoleEnum.METHODIST)

	return isMethodist ? <MethodistDashboard /> : <TeacherDashboard keycloakId={user.keycloakId} />
}
