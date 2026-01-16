import { api } from '@lib'
import { queryOptions } from '@tanstack/react-query'
import type { IUser } from '@types'

const loginUrl = `${process.env.NEXT_PUBLIC_API_URL}/login`
const logoutUrl = `${process.env.NEXT_PUBLIC_API_URL}/logout`

export class AuthService {
	// redirect to login
	redirectToLogin() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = loginUrl
		}
	}

	// redirect to logout
	redirectToLogout() {
		if (typeof window !== 'undefined') {
			// redirecting to backend
			window.location.href = logoutUrl
		}
	}

	// type guard
	private assertUser(data: IUser | null): asserts data is IUser {
		if (!data) {
			throw new Error('data is not exist')
		}

		if (!user?.keycloakID || !user?.username) {
			throw new Error('invalid user data')
		}
	}

	// get me
	getMeOptions = () => {
		return queryOptions({
			queryKey: ['me'],
			queryFn: async () => {
				const { data } = await api.get<IUser | null>('/api/me')

				const user = lowercaseFirstLetter(data)

				// this.assertUser(user)

				return user
			},
			retry: false,
		})
	}
}

// TODO: delete me when it's over
const lowercaseFirstLetter = (obj: Record<string, string>) => {
	return Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [key.charAt(0).toLowerCase() + key.slice(1), value]),
	)
}
