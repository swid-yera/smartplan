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
	LocalizedText,
} from '@types'

import { cleanupDeleteCache } from './query-cache'

export class LessonService {
	private normalizeProgressMinute = (value: unknown): number => {
		if (Array.isArray(value)) {
			return this.normalizeProgressMinute(value[0])
		}

		const parsed = Number(value)

		if (!Number.isFinite(parsed) || parsed < 0) return 0

		return parsed
	}

	private resolveProgressSource = (source: Record<string, unknown>, camelKey: string, snakeKey: string): unknown => {
		if (camelKey in source && source[camelKey] !== undefined) {
			return source[camelKey]
		}

		if (snakeKey in source && source[snakeKey] !== undefined) {
			return source[snakeKey]
		}

		return undefined
	}

	private normalizeMinuteArray = (primary: unknown, fallback?: unknown): number[] => {
		if (Array.isArray(primary) && primary.length) {
			return [this.normalizeProgressMinute(primary[0])]
		}

		if (Array.isArray(fallback) && fallback.length) {
			return [this.normalizeProgressMinute(fallback[0])]
		}

		if (typeof primary === 'number' || typeof primary === 'string') {
			return [this.normalizeProgressMinute(primary)]
		}

		if (typeof fallback === 'number' || typeof fallback === 'string') {
			return [this.normalizeProgressMinute(fallback)]
		}

		return [0]
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
			const firstTime = this.resolveProgressSource(source, 'firstTime', 'first_time')
			const secondTime = this.resolveProgressSource(source, 'secondTime', 'second_time')
			const thirdTime = this.resolveProgressSource(source, 'thirdTime', 'third_time')

			return {
				id: typeof source.id === 'string' && source.id.trim() ? source.id : `lesson-progress-${index}`,
				name: (source.name as LocalizedText) ?? '',
				content,
				firstTime: this.normalizeMinuteArray(firstTime),
				secondTime: this.normalizeMinuteArray(secondTime),
				thirdTime: this.normalizeMinuteArray(thirdTime),
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
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (payload: IGenerateLessonRequest) => {
				const { data } = await api.post<IGenerateLessonResponse>('/lessons/generate-lesson', payload)

				if (!data.status) {
					throw new Error('Не удалось сгенерировать урок')
				}

				return data
			},
			onSuccess: (response) => {
				queryClient.invalidateQueries({ queryKey: ['lessons'] })

				if (response.lessonId) {
					queryClient.invalidateQueries({ queryKey: ['lesson', response.lessonId] })
				}
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
		sort,
	}: {
		currentPage?: number
		pageSize?: number
		search?: string
		teacher?: string
		type?: string
		discipline?: string
		group?: string
		sort?: 'asc' | 'desc'
	}) => {
		return queryOptions<IPagination<ILesson>>({
			queryKey: ['lessons', { currentPage, pageSize, search, teacher, type, discipline, group, sort }],
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
						sort,
					},
				})

				if (!data || !Array.isArray(data.data)) {
					return {
						data: [],
						meta: data?.meta ?? {
							currentPage,
							pageSize,
							pages: 0,
							total: 0,
						},
					}
				}

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
				api.put<IGenerateLessonResponse>(`/lessons/${id}`, changedLesson).then((r) => {
					if (!r.data?.status) {
						throw new Error('Не удалось перегенерировать урок')
					}

					return {
						lessonId: r.data.lessonId || id,
						status: r.data.status,
					}
				}),
			onSuccess: ({ lessonId }, { id }) => {
				queryClient.invalidateQueries({ queryKey: ['lesson', id] })
				queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
				queryClient.invalidateQueries({ queryKey: ['lessons'] })
			},
		})
	}

	// delete by id
	deleteMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (id: string) => {
				const { status } = await api.delete(`/lessons/${id}`)

				if (status < 200 || status >= 300) throw new Error('Не удалось удалить урок')

				return id
			},
			onSuccess: (deletedId) => {
				cleanupDeleteCache(queryClient, deletedId, {
					invalidateQueryKeys: [['lessons']],
					removeQueryKeys: [['lesson', deletedId]],
				})
			},
		})
	}
}
