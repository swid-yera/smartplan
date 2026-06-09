'use client'

import { useEffect, useState } from 'react'

import { notFound, useParams } from 'next/navigation'

import { LessonDetailsContent, Loader, withNavAccess } from '@components'
import { hasRole } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { type Locale, RoleEnum } from '@types'

function LessonPage() {
	const params = useParams<{ id: string }>()
	const { authLoading, user } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const [activeLocale, setActiveLocale] = useState<Locale>(locale)

	useEffect(() => {
		setActiveLocale(locale)
	}, [locale])

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
			activeLocale={activeLocale}
			canManageLesson={isAdmin || isTeacherOwner}
			lesson={lesson}
			userKeycloakId={user.keycloakId}
			userRole={user.role}
			onActiveLocaleChange={setActiveLocale}
		/>
	)
}

export default withNavAccess(LessonPage)
