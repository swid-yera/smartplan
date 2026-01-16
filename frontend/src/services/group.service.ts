import { api } from '@lib'
import { queryOptions } from '@tanstack/react-query'
import type { IGroup, IGroupSyncResponse } from '@types'

export class GroupService {
	// sync
	syncOptions = () => {
		return queryOptions({
			queryKey: [],
			queryFn: async () => {
				const { data } = await api.post<IGroupSyncResponse | null>('/api/groups/sync')

				return data
			},
			retry: false,
		})
	}

	// get all groups
	getAllOptions = () => {
		return queryOptions({
			queryKey: [],
			queryFn: async () => {
				const { data } = await api.get<IGroup[] | null>('/api/groups/')

				return data
			},
			retry: false,
		})
	}
}
