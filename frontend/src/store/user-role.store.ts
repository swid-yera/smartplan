import { create } from 'zustand'

export type UserRole = 'TEACHER' | 'METHODIST'

interface UserRoleState {
	role: UserRole
	userId: string
	setRole: (role: UserRole) => void
	toggleRole: () => void
}

const useUserRoleStore = create<UserRoleState>((set) => ({
	role: 'TEACHER',
	userId: 'user-1',
	setRole: (role) => {
		set({
			role,
			userId: role === 'TEACHER' ? 'user-1' : 'user-2',
		})
	},
	toggleRole: () =>
		set((state) => ({
			role: state.role === 'TEACHER' ? 'METHODIST' : 'TEACHER',
			userId: state.role === 'TEACHER' ? 'user-2' : 'user-1',
		})),
}))

export default useUserRoleStore
