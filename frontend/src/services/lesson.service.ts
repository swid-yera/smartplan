import { api } from '@lib'
import { mutationOptions, queryOptions } from '@tanstack/react-query'
import type { IGenerateLessonRequest, IGenerateLessonResponse, ILesson, IPagination } from '@types'

export class LessonService {
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

				return data
			},
		})
	}

	// get by id
	getByIdOptions = (id: string) => {
		return queryOptions<ILesson>({
			queryKey: ['lesson', id],
			queryFn: async () => {
				const { data } = await api.get<ILesson>(`/lessons/${id}`)

				return data
			},
		})
	}
}
