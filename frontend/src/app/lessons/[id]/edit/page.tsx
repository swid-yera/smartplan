'use client'

import { notFound, useParams } from 'next/navigation'

import { Loader } from '@components'
import { isAuthor } from '@helpers'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'

import { LessonEditForm } from './lesson-edit-form'

export default function LessonEditPage() {
	const params = useParams<{ id: string }>()
	const { authLoading, user } = useAuthStore()

	const { data: lesson, isLoading } = useQuery({
		...services.lesson.getByIdOptions(params.id),
		enabled: !!params.id,
	})

	if (authLoading || isLoading) return <Loader />
	if (!user || !lesson) return notFound()

	const teacherId = lesson.teacher?.keycloakId || lesson.teacher_id || ''
	const canManageLesson = isAuthor(user, teacherId)

	if (!canManageLesson) return notFound()

	return <LessonEditForm lesson={lesson} />
}
