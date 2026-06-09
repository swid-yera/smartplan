'use client'

import { type ComponentType, createElement } from 'react'

import { usePathname } from 'next/navigation'

import { canAccessNavPath } from '@helpers'
import { useAuthStore } from '@store'

import { Development } from '../ui/development'
import { Forbidden } from '../ui/forbidden'
import { Loader } from '../ui/loader'

export function withNavAccess<T extends object>(WrappedComponent: ComponentType<T>, showDevelopmentText = false) {
	const WithNavAccess = (props: T) => {
		const { authLoading, isAuthenticated, user } = useAuthStore()
		const pathname = usePathname()

		if (authLoading) {
			return <Loader />
		}

		if (!isAuthenticated || !user) {
			if (showDevelopmentText) return <Development />

			return <Forbidden />
		}

		if (!canAccessNavPath(user, pathname)) {
			if (showDevelopmentText) return <Development />

			return <Forbidden />
		}

		return createElement(WrappedComponent, props)
	}

	WithNavAccess.displayName = `withNavAccess(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

	return WithNavAccess
}
