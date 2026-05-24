import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type {
	IAward,
	ICreateAwardRequest,
	ICreateTypesRequest,
	IGetAllRequest,
	IMessageResponse,
	IPagination,
	ITypeResponse,
	IUpdateAwardRequest,
	IUpdateStatusRequest,
} from '@types'

import { getCurrentBackendLocale } from './service-locale'

export class AwardService {
	// get all awards
	getAllOptions = ({
		currentPage = 1,
		pageSize = 10,
		search,
		methodist,
		status,
		teacher,
		categoryId,
	}: IGetAllRequest & { categoryId?: string }) => {
		return queryOptions<IPagination<IAward>>({
			queryKey: ['awards', { currentPage, pageSize, search, methodist, teacher, status, categoryId }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IAward>>('/awards', {
					params: {
						locale: getCurrentBackendLocale(),
						currentPage,
						pageSize,
						search,
						methodist,
						teacher,
						categoryId,
						status: status?.join(','),
					},
				})

				if (!data) return { data: [], meta: generateEmptyMetaPagination() }

				return data
			},
		})
	}

	// get award by id
	getByIdOptions = (id: string) => {
		return queryOptions<IAward>({
			queryKey: ['award', id],
			queryFn: async () => {
				const { data } = await api.get<IAward>(`/awards/${id}`, {
					params: {
						locale: getCurrentBackendLocale(),
					},
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
				filesByField: Record<string, File>
			}) => {
				const formData = new FormData()

				formData.append('data', JSON.stringify(newAward))
				Object.entries(filesByField).forEach(([fieldKey, file]) => {
					formData.append(fieldKey, file)
				})

				const { data } = await api.post<IAward>('/awards', formData, {
					headers: { 'Content-Type': 'multipart/form-data' },
				})

				return data
			},

			onSuccess: (createdAward) => {
				queryClient.setQueryData(['award', createdAward.id], createdAward)
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
				filesByField?: Record<string, File>
			}) => {
				const hasFiles = filesByField && Object.keys(filesByField).length > 0

				if (!hasFiles) {
					return api.put<IAward>(`/awards/${id}`, changedAward).then((r) => r.data)
				}

				const formData = new FormData()

				formData.append('data', JSON.stringify(changedAward))
				Object.entries(filesByField).forEach(([fieldKey, file]) => {
					formData.append(fieldKey, file)
				})

				return api
					.put<IAward>(`/awards/${id}`, formData, {
						headers: { 'Content-Type': 'multipart/form-data' },
					})
					.then((r) => r.data)
			},

			onSuccess: (updatedAward, { id }) => {
				queryClient.setQueryData(['award', id], updatedAward)
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
				const { data, statusText } = await api.delete<IMessageResponse>(`/awards/${id}`)

				if (statusText !== 'OK') throw new Error(data.message)

				return id
			},

			onSuccess: (deletedId: string) => {
				// delete from cache getAllRups if exists
				queryClient.setQueryData<IAward[] | null>(['awards'], (old) =>
					old ? old.filter((award) => award.id !== deletedId) : null,
				)

				// delete from getRupById cache if exists
				queryClient.removeQueries({
					queryKey: ['awards', deletedId],
				})
			},
		})
	}

	// --- types
	// get all types
	getAllTypesOptions = () => {
		return queryOptions<ITypeResponse[]>({
			queryKey: ['types'],
			queryFn: async () => {
				const { data } = await api.get<ITypeResponse[]>('/awards/types', {
					params: {
						locale: getCurrentBackendLocale(),
					},
				})

				if (!data) return []

				return data
			},
		})
	}

	// get type by id
	getTypeByIdOptions = (id: string) => {
		return queryOptions<ITypeResponse>({
			queryKey: ['type', id],
			queryFn: async () => {
				const { data } = await api.get<ITypeResponse>(`/awards/types/${id}`, {
					params: {
						locale: getCurrentBackendLocale(),
					},
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
				queryClient.setQueryData(['type', createdType.id], createdType)
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
				queryClient.setQueryData(['type', id], updatedType)
				queryClient.invalidateQueries({ queryKey: ['types'] })
			},
		})
	}

	// delete award by id
	deleteTypeMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (id: string) => {
				const { data, statusText } = await api.delete<IMessageResponse>(`/awards/types/${id}`)

				if (statusText !== 'OK') throw new Error(data.message)

				return id
			},

			onSuccess: (deletedId: string) => {
				// delete from cache getAllRups if exists
				queryClient.setQueryData<ITypeResponse[] | null>(['types'], (old) =>
					old ? old.filter((type) => type.id !== deletedId) : null,
				)

				// delete from getRupById cache if exists
				queryClient.removeQueries({
					queryKey: ['type', deletedId],
				})
			},
		})
	}
}
