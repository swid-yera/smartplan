import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import { type IUser, type PermissionCodeEnum } from '@types'

export interface ISpecialUserWithPermissions {
	keycloakId: string
	email: string
	username: string
	firstName: string
	lastName: string
	permissions: PermissionCodeEnum[]
}

export interface ISetPermissionsPayload {
	permissions: PermissionCodeEnum[]
}

export interface IUserPermissionsPayload {
	userId: string
	permissions: PermissionCodeEnum[]
}

export class PermissionService {
	getPermissionsOptions = (userId: string) => {
		return queryOptions<IUserPermissionsPayload>({
			queryKey: ['permissions', userId],
			queryFn: async () => {
				const { data } = await api.get<{ userId: string; permissions: PermissionCodeEnum[] }>(
					`/permissions/${userId}`,
				)

				return {
					userId: data?.userId ?? userId,
					permissions: data?.permissions ?? [],
				}
			},
		})
	}

	setPermissionsOptions = (userId: string) => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: (payload: ISetPermissionsPayload) =>
				api.put<IUserPermissionsPayload>(`/permissions/${userId}`, payload).then((response) => response.data),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['permissions', userId] })
				queryClient.invalidateQueries({ queryKey: ['users'] })
				queryClient.invalidateQueries({ queryKey: ['user', userId] })
				const me = queryClient.getQueryData<IUser>(['me'])
				if (me?.keycloakId === userId) {
					queryClient.invalidateQueries({ queryKey: ['me'] })
				}
			},
		})
	}

	revokePermissionsOptions = (userId: string) => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async () => {
				await api.delete(`/permissions/${userId}`)
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['permissions', userId] })
				queryClient.invalidateQueries({ queryKey: ['users'] })
				queryClient.invalidateQueries({ queryKey: ['user', userId] })
				const me = queryClient.getQueryData<IUser>(['me'])
				if (me?.keycloakId === userId) {
					queryClient.invalidateQueries({ queryKey: ['me'] })
				}
			},
		})
	}
}
