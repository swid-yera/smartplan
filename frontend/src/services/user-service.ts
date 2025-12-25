import { queryOptions } from '@tanstack/react-query'

import { api } from '@/lib'
import { type IUser } from '@/shared/types'

export class UserService {
	// type guard
	private assertUser(data: any): asserts data is IUser {
		if (!data || !data.id || !data.name || !data.email) {
			throw new Error('Invalid user data')
		}
	}

	getMeOptions = queryOptions({
		queryKey: ['me'],
		queryFn: async () => {
			const { data, status } = await api.get<IUser | null>('/')

			this.assertUser(data)

			return data
		},
	})
}
