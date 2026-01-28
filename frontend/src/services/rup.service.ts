import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type {
	IDownloadResponse,
	IGetAllRequest,
	IMessageResponse,
	IPagination,
	IRup,
	IUpdateRupRequest,
	IUpdateStatusRequest,
} from '@types'

export class RupService {
	// get all
	getAllOptions = ({ currentPage = 1, pageSize = 10, search, methodist, teacher, status }: IGetAllRequest) => {
		return queryOptions<IPagination<IRup>>({
			queryKey: ['rups', { currentPage, pageSize, search, methodist, teacher, status }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IRup>>('/rups', {
					params: {
						currentPage,
						pageSize,
						search,
						methodist,
						teacher,
						status: status?.join(','),
					},
				})

				if (!data) return { data: [], meta: generateEmptyMetaPagination() }

				return data
			},
		})
	}

	// get by id
	getByIdOptions = (id: string) => {
		return queryOptions<IRup>({
			queryKey: ['rup', id],
			queryFn: async () => {
				const { data } = await api.get<IRup>(`/rups/${id}`)

				return data
			},
		})
	}

	// create
	createOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ newRup }: { newRup: IUpdateRupRequest }) => api.post<IRup>('/rups', newRup).then((r) => r.data),

			onSuccess: (createdRup) => {
				queryClient.setQueryData(['rup', createdRup.id], createdRup)
				queryClient.invalidateQueries({ queryKey: ['rups'] })
			},
		})
	}

	// update rup by id
	updateOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, changedRup }: { id: string; changedRup: IUpdateRupRequest }) =>
				api.put<IRup>(`/rups/${id}`, changedRup).then((r) => r.data),

			onSuccess: (updatedRup, { id }) => {
				queryClient.setQueryData(['rup', id], updatedRup)
				queryClient.invalidateQueries({ queryKey: ['rups'] })
			},
		})
	}

	// update rup status by id
	updateStatusOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, ...payload }: IUpdateStatusRequest) =>
				api.put<IMessageResponse>(`/rups/${id}/status`, payload).then((r) => r.data),

			onSuccess: (messageResponse, { id }) => {
				queryClient.invalidateQueries({ queryKey: ['rup', id] })
				queryClient.invalidateQueries({ queryKey: ['rups'] })
			},
		})
	}

	// delete by id
	deleteMutationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (id: string) => {
				const { data, statusText } = await api.delete<IMessageResponse>(`/rups/${id}`)

				if (statusText !== 'OK') throw new Error(data.message)

				return id
			},

			onSuccess: (deletedId: string) => {
				// delete from cache getAllRups if exists
				queryClient.setQueryData<IRup[] | null>(['rups'], (old) =>
					old ? old.filter((rup) => rup.id !== deletedId) : null,
				)

				// delete from getRupById cache if exists
				queryClient.removeQueries({
					queryKey: ['rup', deletedId],
				})
			},
		})
	}

	// get by id
	getDownloadUrlOptions = (id: string) => {
		return queryOptions<IDownloadResponse>({
			queryKey: [],
			queryFn: async () => {
				const { data, status, statusText } = await api.get<IDownloadResponse>(`/rups/${id}/download`)

				if (status !== 200) throw new Error(statusText)

				return data
			},
		})
	}
}
