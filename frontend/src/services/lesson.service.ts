import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import { LessonResourceTypeEnum } from '@types'
import type {
	IGenerateLessonRequest,
	IGenerateLessonResponse,
	ILesson,
	ILessonResource,
	IPagination,
	IUpdateLessonRequest,
} from '@types'

export class LessonService {
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
	}: {
		currentPage?: number
		pageSize?: number
		search?: string
		teacher?: string
	}) => {
		return queryOptions<IPagination<ILesson>>({
			queryKey: ['lessons', { currentPage, pageSize, search, teacher }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<ILesson>>('/lessons', {
					params: {
						currentPage,
						pageSize,
						search,
						teacher,
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
