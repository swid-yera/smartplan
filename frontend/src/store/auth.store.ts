import { create } from 'zustand'

import type { IUser } from '@/shared/types'

interface AuthState {
	user: IUser | null
	isAuthenticated: boolean
	setUser: (user: IUser | null) => void
	logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isAuthenticated: false,

	setUser: (user) => {
		let isAuthenticated = true

		if (!user) {
			isAuthenticated = false
		}

		set({
			user,
			isAuthenticated,
		})
	},

	logout: () =>
		set({
			user: null,
			isAuthenticated: false,
		}),
}))
