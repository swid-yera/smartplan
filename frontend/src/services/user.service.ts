import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib'
import { type IUser } from '@/shared/types'

export class UserService {
	// type guard
	private assertUser(data: IUser | null): asserts data is IUser {
		if (!data) {
			throw new Error('data is not exist')
		}

		if (!data?.keycloak_id || !data.name || !data.email) {
			throw new Error('invalid user data')
		}
	}

	getMeOptions = queryOptions({
		queryKey: ['me'],
		queryFn: async () => {
			const { data } = await api.get<IUser | null>('/api/me')

			this.assertUser(data)

			return data
		},
	})
}
