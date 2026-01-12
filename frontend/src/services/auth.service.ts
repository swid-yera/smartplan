import { api } from '@lib'
import { queryOptions } from '@tanstack/react-query'
import type { IUser } from '@types'

export class AuthService {
	// redirect to login
	redirectToLogin() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/login`
		}
	}

	// redirect to logout
	redirectToLogout() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/logout`
		}
	}

	// type guard
	private assertUser(data: IUser | null): asserts data is IUser {
		if (!data) {
			throw new Error('data is not exist')
		}

		if (!data?.keycloak_id || !data.username || !data.email) {
			throw new Error('invalid user data')
		}
	}

	// get me
	getMeOptions = queryOptions({
		queryKey: ['me'],
		queryFn: async () => {
			const { data } = await api.get<IUser | null>('/api/me')

			this.assertUser(data)

			return data
		},
		retry: false,
	})
}
