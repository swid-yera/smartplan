import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type { ICreatePenaltyRequest, IMessageResponse, IPagination, IPaginationRequest, IPenalty, IUser } from '@types'

export class UserService {
	// get all
	getAllOptions = ({ currentPage = 1, pageSize = 10, search = '' }: IPaginationRequest) => {
		const text = search.trim()

		return queryOptions<IPagination<IUser>>({
			queryKey: ['users', { currentPage, pageSize, search: text }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IUser>>('/users', {
					params: {
						currentPage,
						pageSize,
						search: text,
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

	// create penalty by teacher id
	createPenaltyOptions = (teacherId: string) => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: (payload: ICreatePenaltyRequest) =>
				api.post<IPenalty>(`/user/${teacherId}/penalty`, payload).then((r) => r.data),

			onSuccess: (createdPenalty) => {
				queryClient.setQueryData(['user-penalty', teacherId, createdPenalty.id], createdPenalty)
				queryClient.invalidateQueries({ queryKey: ['user-penalties', teacherId] })
				queryClient.invalidateQueries({ queryKey: ['user', teacherId] })
				queryClient.invalidateQueries({ queryKey: ['users'] })
			},
		})
	}

	// get all penalties by teacher id
	getAllPenaltiesByTeacherIdOptions = (teacherId: string) => {
		return queryOptions<IPenalty[]>({
			queryKey: ['user-penalties', teacherId],
			queryFn: async () => {
				const { data } = await api.get<IPenalty[] | null>(`/user/${teacherId}/penalty`)

				if (!data) return []

				return data
			},
		})
	}

	// get penalty by teacher id + penalty id
	getPenaltyByIdAndTeacherIdOptions = (teacherId: string, penaltyId: string) => {
		return queryOptions<IPenalty>({
			queryKey: ['user-penalty', teacherId, penaltyId],
			queryFn: async () => {
				const { data } = await api.get<IPenalty>(`/user/${teacherId}/penalty/${penaltyId}`)

				return data
			},
		})
	}

	// delete penalty by teacher id + penalty id
	deletePenaltyByIdAndTeacherIdOptions = (teacherId: string) => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (penaltyId: string) => {
				await api.delete<IMessageResponse>(`/user/${teacherId}/penalty/${penaltyId}`)

				return penaltyId
			},

			onSuccess: (deletedPenaltyId) => {
				queryClient.removeQueries({ queryKey: ['user-penalty', teacherId, deletedPenaltyId] })
				queryClient.invalidateQueries({ queryKey: ['user-penalties', teacherId] })
				queryClient.invalidateQueries({ queryKey: ['user', teacherId] })
				queryClient.invalidateQueries({ queryKey: ['users'] })
			},
		})
	}
}
