import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { queryOptions } from '@tanstack/react-query'
import type { IPagination, IPaginationRequest, IUser } from '@types'

export class UserService {
	// get all
	getAllOptions = ({ currentPage = 1, pageSize = 10, search = '' }: IPaginationRequest) => {
		return queryOptions<IPagination<IUser>>({
			queryKey: ['users', { currentPage, pageSize, search }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IUser>>('/users', {
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

	// get all rating
	getAllRatingOptions = ({ currentPage = 1, pageSize = 10, search = '' }: IPaginationRequest) => {
		return queryOptions<IPagination<IUser>>({
			queryKey: ['users-rating', { currentPage, pageSize, search }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IUser>>('/users/rating', {
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
