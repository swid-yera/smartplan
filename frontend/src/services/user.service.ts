import { api } from '@lib'
import { queryOptions } from '@tanstack/react-query'
import type { IUser } from '@types'

export class UserService {
	// get all
	getAllOptions = () => {
		return queryOptions<IUser[]>({
			queryKey: ['users'],
			queryFn: async () => {
				const { data } = await api.get<IUser[]>('/users')

				if (!data) return []

				return data
			},
		})
	}

	// get by id
	getByIdOptions = (id: string) => {
		return queryOptions<IUser>({
			queryKey: ['user', id],
			queryFn: async () => {
				const { data } = await api.get<IUser>(`/users/${id}`)

				return data
			},
		})
	}
}
