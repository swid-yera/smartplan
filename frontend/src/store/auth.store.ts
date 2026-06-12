import { type IUser, type IViolationRecord, UserTypeEnum, ViolationEnum } from '@types'
import { create } from 'zustand'

type IAuthUser = IUser & {
	violation: ViolationEnum
	violations: IViolationRecord[]
}

interface AuthState {
	user: IAuthUser | null
	isAuthenticated: boolean
	authLoading: boolean
	setUser: (user: IUser | null) => void
	logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	isAuthenticated: false,
	authLoading: true,

	setUser: (user) => {
		const isAuthenticated = Boolean(user)
		const normalizedUser: IAuthUser | null = user
			? {
					...user,
					permissions: user.permissions ?? [],
					userType: user.userType ?? UserTypeEnum.NULL,
					violation: user.violation ?? ViolationEnum.NONE,
					violations: user.violations ?? [],
				}
			: null

		set({
			user: normalizedUser,
			isAuthenticated,
			authLoading: false,
		})
	},

	logout: () =>
		set({
			user: null,
			isAuthenticated: false,
		}),
}))
