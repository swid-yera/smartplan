'use client'

import { useEffect, useState } from 'react'

import { notFound, useParams } from 'next/navigation'

import { LessonEditForm, Loader, withRole } from '@components'
import { isAuthor } from '@helpers'
import { services } from '@services'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import type { Locale } from '@types'
import { RoleEnum } from '@types'

function LessonEditPage() {
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
	const canManageLesson = isAuthor(user, teacherId)

	if (!canManageLesson) return notFound()

	return <LessonEditForm activeLocale={activeLocale} lesson={lesson} onActiveLocaleChange={setActiveLocale} />
}

export default withRole(LessonEditPage, [RoleEnum.ADMIN], true)
