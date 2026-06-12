import { generateEmptyMetaPagination } from '@helpers'
import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type {
	ICreatePenaltyRequest,
	IMessageResponse,
	IPagination,
	IPaginationRequest,
	IPenalty,
	IUpsertViolationRequest,
	IUser,
	IViolationActionResponse,
} from '@types'

import { cleanupDeleteCache } from './query-cache'

export class UserService {
	// get all
	getAllOptions = ({ currentPage = 1, pageSize = 10, search = '', sort, departmentId }: IPaginationRequest) => {
		const text = search.trim()
		const department = departmentId?.trim()

		const fetchUsersPage = async (page: number) => {
			const { data } = await api.get<IPagination<IUser>>('/users', {
				params: {
					currentPage: page,
					pageSize,
					search: text,
					sort,
					departmentId: department || undefined,
				},
			})

			if (!data) {
				return { data: [], meta: generateEmptyMetaPagination() }
			}

			return data
		}

		return queryOptions<IPagination<IUser>>({
			queryKey: ['users', { currentPage, pageSize, search: text, sort, departmentId: department }],
			queryFn: async () => {
				const firstPage = await fetchUsersPage(currentPage)

				if (!department || firstPage.meta.pages <= currentPage) {
					return firstPage
				}

				const allUsers = [...firstPage.data]

				for (let page = currentPage + 1; page <= firstPage.meta.pages; page += 1) {
					const pageData = await fetchUsersPage(page)

					allUsers.push(...pageData.data)
				}

				return {
					data: allUsers,
					meta: {
						...firstPage.meta,
						currentPage,
						total: firstPage.meta.total,
					},
				}
			},
		})
	}

	// get all rating
	getAllRatingOptions = ({ currentPage = 1, pageSize = 10, search = '', sort }: IPaginationRequest) => {
		return queryOptions<IPagination<IUser>>({
			queryKey: ['users-rating', { currentPage, pageSize, search, sort }],
			queryFn: async () => {
				const { data } = await api.get<IPagination<IUser>>('/users/rating', {
					params: {
						currentPage,
						pageSize,
						search,
						sort,
					},
				})

				if (!data) return { data: [], meta: generateEmptyMetaPagination() }

				return data
			},
		})
	}

	// get teachers rating with departments for statistics
	getTeachersRatingOptions = () => {
		return queryOptions<IUser[]>({
			queryKey: ['teachers-rating'],
			queryFn: async () => {
				const { data } = await api.get<IUser[]>('/statistics/teachers/rating')

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
	getAllPenaltiesByTeacherIdOptions = (teacherId: string, params?: { sort?: 'asc' | 'desc' }) => {
		return queryOptions<IPenalty[]>({
			queryKey: ['user-penalties', teacherId, params?.sort],
			queryFn: async () => {
				const { data } = await api.get<IPenalty[] | null>(`/user/${teacherId}/penalty`, {
					params: {
						sort: params?.sort,
					},
				})

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
				cleanupDeleteCache(queryClient, deletedPenaltyId, {
					invalidateQueryKeys: [['user-penalties', teacherId], ['user', teacherId], ['users']],
					removeQueryKeys: [['user-penalty', teacherId, deletedPenaltyId]],
				})
			},
		})
	}

	// create violation by user id
	createViolationOptions = (userId: string) => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: (payload: IUpsertViolationRequest) =>
				api.post<IViolationActionResponse>(`/users/${userId}/violation`, payload).then((r) => r.data),

			onSuccess: (result) => {
				queryClient.setQueryData(['user', userId], result.user)
				queryClient.invalidateQueries({ queryKey: ['users'] })
			},
		})
	}

	// update violation by user id + violation id
	updateViolationOptions = (userId: string) => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: ({ violationId, payload }: { violationId: string; payload: IUpsertViolationRequest }) =>
				api.put<IViolationActionResponse>(`/users/${userId}/violation/${violationId}`, payload).then((r) => r.data),

			onSuccess: (result) => {
				queryClient.setQueryData(['user', userId], result.user)
				queryClient.invalidateQueries({ queryKey: ['users'] })
			},
		})
	}

	// delete violation by user id + violation id
	deleteViolationOptions = (userId: string) => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (violationId: string) => {
				await api.delete<void>(`/users/${userId}/violation/${violationId}`)

				return violationId
			},

			onSuccess: () => {
				cleanupDeleteCache(queryClient, userId, {
					invalidateQueryKeys: [['user', userId], ['users']],
				})
			},
		})
	}
}
