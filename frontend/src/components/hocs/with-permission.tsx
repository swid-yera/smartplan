'use client'

import { type ComponentType, createElement } from 'react'

import { hasAnyPermission } from '@helpers'
import { useAuthStore } from '@store'
import { PermissionCodeEnum } from '@types'

import { Development } from '../ui/development'
import { Forbidden } from '../ui/forbidden'
import { Loader } from '../ui/loader'

export function withPermission<T extends object>(
	WrappedComponent: ComponentType<T>,
	allowedPermissions: PermissionCodeEnum[] = [],
	showDevelopmentText = false,
) {
	const WithPermission = (props: T) => {
		const { authLoading, isAuthenticated, user } = useAuthStore()

		if (authLoading) {
			return <Loader />
		}

		if (!isAuthenticated || !user) {
			if (showDevelopmentText) return <Development />

			return <Forbidden />
		}

		if (allowedPermissions.length > 0 && !hasAnyPermission(user, allowedPermissions)) {
			if (showDevelopmentText) return <Development />

			return <Forbidden />
		}

		return createElement(WrappedComponent, props)
	}

	WithPermission.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

	return WithPermission
}
