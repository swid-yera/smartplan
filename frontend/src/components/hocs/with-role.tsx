'use client'

import { type ComponentType, createElement } from 'react'

import { hasRole } from '@helpers'
import { useAuthStore } from '@store'
import { RoleEnum } from '@types'

import { Development } from '../ui/development'
import { Forbidden } from '../ui/forbidden'
import { Loader } from '../ui/loader'

export function withRole<T extends object>(
	WrappedComponent: ComponentType<T>,
	allowedRoles: RoleEnum[] = [],
	showDevelopmentText = false,
) {
	const WithRole = (props: T) => {
		const { authLoading, isAuthenticated, user } = useAuthStore()

		if (authLoading) {
			return <Loader />
		}

		if (!isAuthenticated || !user) {
			if (showDevelopmentText) return <Development />

			return <Forbidden />
		}

		if (allowedRoles.length > 0 && !allowedRoles.some((role) => hasRole(user.role, role, true))) {
			if (showDevelopmentText) return <Development />

			return <Forbidden />
		}

		return createElement(WrappedComponent, props)
	}

	WithRole.displayName = `withRole(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

	return WithRole
}
