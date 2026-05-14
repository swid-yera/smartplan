import { api, getApiBaseUrl } from '@lib'
import { queryOptions } from '@tanstack/react-query'
import type { IUser } from '@types'

const buildAuthUrl = (path: '/login' | '/logout') => `${getApiBaseUrl().replace(/\/+$/, '')}${path}`

export class AuthService {
	// redirect to login
	redirectToLogin() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = buildAuthUrl('/login')
		}
	}

	// redirect to logout
	redirectToLogout() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = buildAuthUrl('/logout')
		}
	}

	// type guard
	private assertUser(data: IUser | null): asserts data is IUser {
		if (!data) {
			throw new Error('data is not exist')
		}

		if (!data?.keycloakId || !data?.username) {
			throw new Error('invalid user data')
		}
	}

	// get me
	getMeOptions = () => {
		return queryOptions({
			queryKey: ['me'],
			queryFn: async () => {
				const { data } = await api.get<IUser | null>('/me')

				this.assertUser(data)

				return data
			},
			retry: false,
		})
	}
}
