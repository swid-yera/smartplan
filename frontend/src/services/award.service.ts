import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type {
	IAward,
	IAwardUserKpiSummaryResponse,
	ICreateAwardRequest,
	ICreateTypesRequest,
	IDepartmentRatingResponse,
	IGetAllRequest,
	IMessageResponse,
	IPagination,
	IReviewTeacherSummaryResponse,
	ITypeResponse,
	IUpdateAwardRequest,
	IUpdateStatusRequest,
} from '@types'

import { cleanupDeleteCache } from './query-cache'
import { getCurrentBackendLocale } from './service-locale'

export class AwardService {
	// get departments rating
	getAllDepartmentsOptions = () => {
		const locale = getCurrentBackendLocale()

		return queryOptions<IDepartmentRatingResponse[]>({
			queryKey: ['awards-departments', locale],
			queryFn: async () => {
				const { data } = await api.get<IDepartmentRatingResponse[]>('/awards/departments', {
					params: { locale },
				})

				if (!data) return []

				return data
			},
		})
	}

	// get teachers with awards in review
	getReviewTeachersOptions = () => {
		return queryOptions<IReviewTeacherSummaryResponse[]>({
			queryKey: ['awards-review-teachers'],
			queryFn: async () => {
				const { data } = await api.get<IReviewTeacherSummaryResponse[]>('/awards/review-teachers')

				if (!data) return []

				return data
			},
		})
	}

	// get grouped KPI awards summary for user profile
	getUserKpiAwardsSummaryOptions = (userId: string) => {
		return queryOptions<IAwardUserKpiSummaryResponse>({
			queryKey: ['users-kpi-awards-summary', userId],
			queryFn: async () => {
				const { data } = await api.get<IAwardUserKpiSummaryResponse>(`/awards/users/${userId}/summary`)

				return data
			},
		})
	}

	// get top departments rating for statistics
	getTopDepartmentsOptions = () => {
		const locale = getCurrentBackendLocale()

		return queryOptions<IDepartmentRatingResponse[]>({
			queryKey: ['statistics-top-departments', locale],
			queryFn: async () => {
				const { data } = await api.get<IDepartmentRatingResponse[]>('/statistics/departments/top', {
					params: { locale },
				})

				if (!data) return []

				return data
			},
		})
	}

	// get all awards
	getAllOptions = ({
		currentPage = 1,
		pageSize = 10,
		search,
		methodist,
		status,
		teacher,
		categoryId,
		sort,
	}: IGetAllRequest & { categoryId?: string | string[]; sort?: 'asc' | 'desc' }) => {
		const categoryIdParam = Array.isArray(categoryId)
			? categoryId
					.map((id) => id.trim())
					.filter(Boolean)
					.join(',')
			: categoryId
					?.split(',')
					.map((id) => id.trim())
					.filter(Boolean)
					.join(',')

		const locale = getCurrentBackendLocale()

		return queryOptions<IPagination<IAward>>({
			queryKey: [
				'awards',
				{ currentPage, pageSize, search, methodist, teacher, status, categoryId: categoryIdParam, sort, locale },
			],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IAward>>('/awards', {
					params: {
						locale,
						currentPage,
						pageSize,
						search,
						methodist,
						teacher,
						categoryId: categoryIdParam,
						status: status?.join(','),
						sort,
					},
				})

				if (!data) return { data: [], meta: generateEmptyMetaPagination() }

				return data
			},
		})
	}

	// get award by id
	getByIdOptions = (id: string) => {
		const locale = getCurrentBackendLocale()

		return queryOptions<IAward>({
			queryKey: ['award', id, locale],
			queryFn: async () => {
				const { data } = await api.get<IAward>(`/awards/${id}`, {
					params: { locale },
				})

				return data
			},
		})
	}

	// create award
	createOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async ({
				newAward,
				filesByField,
			}: {
				newAward: ICreateAwardRequest
				filesByField: Record<string, File[]>
			}) => {
				const formData = new FormData()

				formData.append('data', JSON.stringify(newAward))
				Object.entries(filesByField).forEach(([fieldKey, files]) => {
					files.forEach((file) => formData.append(fieldKey, file))
				})

				const { data } = await api.post<IAward>('/awards', formData, {
					headers: { 'Content-Type': 'multipart/form-data' },
				})

				return data
			},

			onSuccess: (createdAward) => {
				const locale = getCurrentBackendLocale()
				queryClient.setQueryData(['award', createdAward.id, locale], createdAward)
				queryClient.invalidateQueries({ queryKey: ['awards'] })
			},
		})
	}

	// update awards by id
	updateOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({
				id,
				changedAward,
				filesByField,
			}: {
				id: string
				changedAward: IUpdateAwardRequest
				filesByField?: Record<string, File[]>
			}) => {
				const hasFiles =
					filesByField && Object.values(filesByField).some((files) => Array.isArray(files) && files.length > 0)

				if (!hasFiles) {
					return api.put<IAward>(`/awards/${id}`, changedAward).then((r) => r.data)
				}

				const formData = new FormData()

				formData.append('data', JSON.stringify(changedAward))
				Object.entries(filesByField).forEach(([fieldKey, files]) => {
					files.forEach((file) => formData.append(fieldKey, file))
				})

				return api
					.put<IAward>(`/awards/${id}`, formData, {
						headers: { 'Content-Type': 'multipart/form-data' },
					})
					.then((r) => r.data)
			},

			onSuccess: (updatedAward, { id }) => {
				const locale = getCurrentBackendLocale()
				queryClient.setQueryData(['award', id, locale], updatedAward)
				queryClient.invalidateQueries({ queryKey: ['awards'] })
			},
		})
	}

	// update award status by id
	updateStatusOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, ...payload }: IUpdateStatusRequest) =>
				api.put<IMessageResponse>(`/awards/${id}/status`, payload).then((r) => r.data),

			onSuccess: (messageResponse, { id }) => {
				queryClient.invalidateQueries({ queryKey: ['award', id] })
				queryClient.invalidateQueries({ queryKey: ['awards'] })
			},
		})
	}

	// delete award by id
	deleteMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (id: string) => {
				const { status } = await api.delete(`/awards/${id}`)

				if (status !== 204) throw new Error('Не удалось удалить KPI')

				return id
			},

			onSuccess: (deletedId: string) => {
				cleanupDeleteCache(queryClient, deletedId, {
					invalidateQueryKeys: [['awards']],
					removeQueryKeys: [['awards', deletedId]],
				})
			},
		})
	}

	// --- types
	// get all types
	getAllTypesOptions = () => {
		const locale = getCurrentBackendLocale()

		return queryOptions<ITypeResponse[]>({
			queryKey: ['types', locale],
			queryFn: async () => {
				const { data } = await api.get<ITypeResponse[]>('/awards/types', {
					params: { locale },
				})

				if (!data) return []

				return data
			},
		})
	}

	// get type by id
	getTypeByIdOptions = (id: string) => {
		const locale = getCurrentBackendLocale()

		return queryOptions<ITypeResponse>({
			queryKey: ['type', id, locale],
			queryFn: async () => {
				const { data } = await api.get<ITypeResponse>(`/awards/types/${id}`, {
					params: { locale },
				})

				return data
			},
		})
	}

	// create type
	createTypeOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ newType }: { newType: ICreateTypesRequest }) =>
				api.post<ITypeResponse>('/awards/types', newType).then((r) => r.data),

			onSuccess: (createdType) => {
				const locale = getCurrentBackendLocale()
				queryClient.setQueryData(['type', createdType.id, locale], createdType)
				queryClient.invalidateQueries({ queryKey: ['types'] })
			},
		})
	}

	// update type by id
	updateTypeOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, changedType }: { id: string; changedType: ICreateTypesRequest }) =>
				api.put<ITypeResponse>(`/awards/types/${id}`, changedType).then((r) => r.data),

			onSuccess: (updatedType, { id }) => {
				const locale = getCurrentBackendLocale()
				queryClient.setQueryData(['type', id, locale], updatedType)
				queryClient.invalidateQueries({ queryKey: ['types'] })
			},
		})
	}

	// delete award by id
	deleteTypeMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (id: string) => {
				const { status } = await api.delete(`/awards/types/${id}`)

				if (status !== 204) throw new Error('Не удалось удалить тип KPI')

				return id
			},

			onSuccess: (deletedId: string) => {
				cleanupDeleteCache(queryClient, deletedId, {
					invalidateQueryKeys: [['types']],
					removeQueryKeys: [['type', deletedId]],
				})
			},
		})
	}
}
