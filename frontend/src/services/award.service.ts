import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type {
	IAward,
	ICreateAwardRequest,
	ICreateTypesRequest,
	IMessageResponse,
	IPagination,
	IPaginationRequest,
	ITypeResponse,
	IUpdateStatusRequest,
} from '@types'

export class AwardService {
	// get all awards
	getAllOptions = ({ currentPage = 1, pageSize = 10, search }: IPaginationRequest) => {
		return queryOptions<IPagination<IAward>>({
			queryKey: ['awards'],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IAward>>('/awards', {
					params: {
						currentPage,
						pageSize,
						search,
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
				const { data } = await api.get<IAward>(`/awards/${id}`)

				return data
			},
		})
	}

	// create award
	createOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ newAward }: { newAward: ICreateAwardRequest }) =>
				api.post<IAward>('/awards', newAward).then((r) => r.data),

			onSuccess: (createdAward) => {
				queryClient.setQueryData(['award', createdAward.id], createdAward)
			},
		})
	}

	// update awards by id
	updateOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, changedAward }: { id: string; changedAward: ICreateAwardRequest }) =>
				api.put<IAward>(`/awards/${id}`, changedAward).then((r) => r.data),

			onSuccess: (updatedAward, { id }) => {
				queryClient.setQueryData(['award', id], updatedAward)
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
				queryClient.invalidateQueries({ queryKey: ['rup', id] })
				queryClient.invalidateQueries({ queryKey: ['rups'] })
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
				const { data } = await api.get<ITypeResponse[]>('/awards/types')

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
				const { data } = await api.get<ITypeResponse>(`/awards/types/${id}`)

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
