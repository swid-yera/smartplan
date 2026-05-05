'use client'

import { notFound, useParams } from 'next/navigation'

import { Loader } from '@components'
import { hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum } from '@types'

import { LessonDetailsContent } from './lesson-details-content'

export default function LessonPage() {
	const params = useParams<{ id: string }>()
	const { authLoading, user } = useAuthStore()

	const { data: lesson, isLoading } = useQuery({
		...services.lesson.getByIdOptions(params.id),
		enabled: !!params.id,
	})

	if (authLoading || isLoading) return <Loader />
	if (!user || !lesson) return notFound()

	const teacherId = lesson.teacher?.keycloakId || lesson.teacher_id || ''
	const isAdmin = hasRole(user.role, RoleEnum.ADMIN)
	const isTeacherOwner = hasRole(user.role, RoleEnum.TEACHER, false) && user.keycloakId === teacherId

	return (
		<LessonDetailsContent
			canManageLesson={isAdmin || isTeacherOwner}
			lesson={lesson}
			userKeycloakId={user.keycloakId}
			userRole={user.role}
		/>
	)
}
