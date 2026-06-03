import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type {
	BackendLocale,
	ICreateRupRequest,
	IDownloadResponse,
	IGetAllRequest,
	IMessageResponse,
	IPagination,
	IRegenerateLanguageGenerationRequest,
	IRup,
	IRupLanguageGenerationStatus,
	IUpdateRupRequest,
	IUpdateStatusRequest,
} from '@types'

import { cleanupDeleteCache } from './query-cache'

export class RupService {
	// get all
	getAllOptions = ({ currentPage = 1, pageSize = 10, search, methodist, teacher, status, sort }: IGetAllRequest) => {
		return queryOptions<IPagination<IRup>>({
			queryKey: ['rups', { currentPage, pageSize, search, methodist, teacher, status, sort }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IRup>>('/rups', {
					params: {
						currentPage,
						pageSize,
						search,
						methodist,
						teacher,
						status: status?.join(','),
						sort,
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

	getLanguageGenerationStatusOptions = (id: string) => {
		return queryOptions<IRupLanguageGenerationStatus>({
			queryKey: ['rup-language-generation', id],
			queryFn: async () => {
				const { data } = await api.get<IRupLanguageGenerationStatus>(`/rups/${id}/language-generation`)

				return data
			},
		})
	}

	regenerateLanguageGenerationOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ id, sourceLanguage }: IRegenerateLanguageGenerationRequest) =>
				api
					.post<IRupLanguageGenerationStatus>(`/rups/${id}/language-generation/regenerate`, {
						sourceLanguage,
					})
					.then((r) => r.data),
			onSuccess: (status, { id }) => {
				queryClient.setQueryData(['rup-language-generation', id], status)
				queryClient.invalidateQueries({ queryKey: ['rup', id] })
			},
		})
	}

	// create
	createOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ newRup }: { newRup: ICreateRupRequest }) => {
				return api.post<IRup>('/rups', newRup).then((r) => r.data)
			},

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
				const { status } = await api.delete(`/rups/${id}`)

				if (status !== 204) throw new Error('Не удалось удалить РУП')

				return id
			},

			onSuccess: (deletedId: string) => {
				cleanupDeleteCache(queryClient, deletedId, {
					invalidateQueryKeys: [['rups']],
					removeQueryKeys: [['rup', deletedId]],
				})
			},
		})
	}

	// get by id
	getDownloadUrlOptions = (id: string, locale: BackendLocale) => {
		return queryOptions<IDownloadResponse>({
			queryKey: ['rup-download', id, locale],
			queryFn: async () => {
				const { data, status, statusText } = await api.get<IDownloadResponse>(`/rups/${id}/download`, {
					params: { locale },
				})

				if (status !== 200) throw new Error(statusText)

				return data
			},
		})
	}
}
