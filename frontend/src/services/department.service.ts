import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type { IDepartmentRatingResponse, IGroupSyncResponse } from '@types'

import { getCurrentBackendLocale } from './service-locale'

export class DepartmentService {
	getAllOptions = () => {
		const locale = getCurrentBackendLocale()

		return queryOptions<IDepartmentRatingResponse[]>({
			queryKey: ['departments', locale],
			queryFn: async () => {
				const { data } = await api.get<IDepartmentRatingResponse[]>('/departments', {
					params: { locale },
				})

				if (!data) return []

				return data
			},
		})
	}

	syncOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async () => {
				const { data } = await api.post<IGroupSyncResponse | null>('/departments/sync')

				return data
			},

			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['departments'] })
				queryClient.invalidateQueries({ queryKey: ['awards-departments'] })
				queryClient.invalidateQueries({ queryKey: ['statistics-top-departments'] })
			},
		})
	}
}
