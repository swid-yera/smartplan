import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import { LessonResourceTypeEnum } from '@types'
import type {
	IGenerateLessonRequest,
	IGenerateLessonResponse,
	ILesson,
	ILessonProgress,
	ILessonResource,
	IPagination,
	IUpdateLessonRequest,
} from '@types'

export class LessonService {
	private normalizeProgressMinute = (value: unknown): number => {
		if (Array.isArray(value)) {
			return this.normalizeProgressMinute(value[0])
		}

		const parsed = Number(value)

		if (!Number.isFinite(parsed) || parsed < 0) return 0

		return parsed
	}

	private normalizeLessonProgress = (items: unknown): ILessonProgress[] => {
		if (!Array.isArray(items)) return []

		return items.map((item, index) => {
			const source = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}
			const rawContent = source.content
			const contentItems = Array.isArray(rawContent)
				? rawContent
				: typeof rawContent === 'string'
					? rawContent.split('\n')
					: []
			const content = contentItems
				.map((contentItem) => (typeof contentItem === 'string' ? contentItem.trim() : ''))
				.filter(Boolean)

			return {
				id: typeof source.id === 'string' && source.id.trim() ? source.id : `lesson-progress-${index}`,
				name: typeof source.name === 'string' ? source.name : '',
				content,
				startMinute: this.normalizeProgressMinute(source.startMinute ?? source.start_minute),
				endMinute: this.normalizeProgressMinute(source.endMinute ?? source.end_minute),
			}
		})
	}

	private normalizeResource = (
		resource: ILessonResource | string,
		type: LessonResourceTypeEnum,
		index: number,
	): ILessonResource => {
		if (typeof resource === 'string') {
			return {
				id: `${type.toLowerCase()}-${index}`,
				name: resource,
				link: '',
				type,
			}
		}

		return {
			...resource,
			type: resource.type || type,
			link: resource.link || '',
		}
	}

	private normalizeLesson = (lesson: ILesson): ILesson => {
		return {
			...lesson,
			lesson_progress: this.normalizeLessonProgress(
				(lesson as ILesson & { lesson_progress?: unknown }).lesson_progress,
			),
			internet_resources: (lesson.internet_resources || []).map((resource, index) =>
				this.normalizeResource(resource, LessonResourceTypeEnum.INTERNET, index),
			),
			technical_resources: (lesson.technical_resources || []).map((resource, index) =>
				this.normalizeResource(resource, LessonResourceTypeEnum.TECHNICAL, index),
			),
		}
	}

	// generate lesson
	generateLessonOptions = () => {
		return mutationOptions({
			mutationFn: async (payload: IGenerateLessonRequest) => {
				const { data } = await api.post<IGenerateLessonResponse>('/lessons/generate-lesson', payload)

				if (!data.status) {
					throw new Error('Не удалось сгенерировать урок')
				}

				return data
			},
		})
	}

	// get all
	getAllOptions = ({
		currentPage = 1,
		pageSize = 10,
		search,
		teacher,
		type,
		discipline,
		group,
	}: {
		currentPage?: number
		pageSize?: number
		search?: string
		teacher?: string
		type?: string
		discipline?: string
		group?: string
	}) => {
		return queryOptions<IPagination<ILesson>>({
			queryKey: ['lessons', { currentPage, pageSize, search, teacher, type, discipline, group }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<ILesson>>('/lessons', {
					params: {
						currentPage,
						pageSize,
						search,
						teacher,
						type,
						discipline,
						group,
					},
				})

				return {
					...data,
					data: data.data.map((lesson) => this.normalizeLesson(lesson)),
				}
			},
		})
	}

	// get by id
	getByIdOptions = (id: string) => {
		return queryOptions<ILesson>({
			queryKey: ['lesson', id],
			queryFn: async () => {
				const { data } = await api.get<ILesson>(`/lessons/${id}`)

				return this.normalizeLesson(data)
			},
		})
	}

	// update by id
	updateMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, changedLesson }: { id: string; changedLesson: IUpdateLessonRequest }) =>
				api.put<ILesson>(`/lessons/${id}`, changedLesson).then((r) => this.normalizeLesson(r.data)),
			onSuccess: (updatedLesson, { id }) => {
				queryClient.setQueryData(['lesson', id], updatedLesson)
				queryClient.invalidateQueries({ queryKey: ['lessons'] })
			},
		})
	}

	// delete by id
	deleteMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (id: string) => {
				const { data } = await api.delete<{ status: boolean; message?: string }>(`/lessons/${id}`)

				if (!data.status) throw new Error(data.message || 'Не удалось удалить урок')

				return id
			},
			onSuccess: (deletedId) => {
				queryClient.invalidateQueries({ queryKey: ['lessons'] })
				queryClient.removeQueries({ queryKey: ['lesson', deletedId] })
			},
		})
	}
}
