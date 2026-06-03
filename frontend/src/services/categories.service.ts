import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type { ICategoryListItemResponse, ICategoryRequest, ICategoryResponse } from '@types'

import { cleanupDeleteCache } from './query-cache'
import { getCurrentBackendLocale } from './service-locale'

export class CategoriesService {
	// get all categories
	getAllOptions = () => {
		return queryOptions<ICategoryListItemResponse[]>({
			queryKey: ['categories'],
			queryFn: async () => {
				const { data } = await api.get<ICategoryListItemResponse[] | null>('/categories', {
					params: {
						locale: getCurrentBackendLocale(),
					},
				})

				if (!data) return []

				return data
			},
		})
	}

	// get category by id
	getByIdOptions = (id: string) => {
		return queryOptions<ICategoryResponse>({
			queryKey: ['category', id],
			queryFn: async () => {
				const { data } = await api.get<ICategoryResponse>(`/categories/${id}`, {
					params: {
						locale: getCurrentBackendLocale(),
					},
				})

				return data
			},
		})
	}

	// create category
	createOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ newCategory }: { newCategory: ICategoryRequest }) =>
				api.post<ICategoryResponse>('/categories', newCategory).then((r) => r.data),

			onSuccess: (createdCategory) => {
				queryClient.setQueryData(['category', createdCategory.id], createdCategory)
				queryClient.invalidateQueries({ queryKey: ['categories'] })
			},
		})
	}

	// update category by id
	updateOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, changedCategory }: { id: string; changedCategory: ICategoryRequest }) =>
				api.put<ICategoryResponse>(`/categories/${id}`, changedCategory).then((r) => r.data),

			onSuccess: (updatedCategory, { id }) => {
				queryClient.setQueryData(['category', id], updatedCategory)
				queryClient.invalidateQueries({ queryKey: ['categories'] })
			},
		})
	}

	// delete category by id
	deleteMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (id: string) => {
				const { status } = await api.delete(`/categories/${id}`)

				if (status !== 204) throw new Error('Не удалось удалить категорию')

				return id
			},

			onSuccess: (deletedId: string) => {
				cleanupDeleteCache(queryClient, deletedId, {
					invalidateQueryKeys: [['categories']],
					removeQueryKeys: [['category', deletedId]],
				})
			},
		})
	}
}
