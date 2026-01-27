import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type { IGroup, IGroupSyncResponse } from '@types'

export class GroupService {
	// sync
	syncOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async () => {
				const { data } = await api.post<IGroupSyncResponse | null>('/groups/sync')

				return data
			},

			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['groups'] })
			},
		})
	}

	// get all groups
	getAllOptions = () => {
		return queryOptions({
			queryKey: ['groups'],
			queryFn: async () => {
				const { data } = await api.get<IGroup[] | null>('/groups')

				if (!data) return []

				return data
			},
			retry: false,
		})
	}
}
