import { type IUser } from '@types'

import { type INav, navMain } from '../components/layout/a-sidebar/nav-data'
import { hasAnyPermission, hasRole } from './user.helper'

const normalizePath = (value: string): string => {
	const pathname = value.split('?')[0]?.split('#')[0] ?? ''

	if (!pathname) return '/'

	if (pathname.length > 1 && pathname.endsWith('/')) {
		return pathname.slice(0, -1)
	}

	return pathname
}

const isPathMatch = (pathname: string, url: string): boolean => {
	const normalizedPathname = normalizePath(pathname)
	const normalizedUrl = normalizePath(url)

	return normalizedPathname === normalizedUrl || normalizedPathname.startsWith(`${normalizedUrl}/`)
}

const flattenNavItems = (items: INav[]): INav[] => {
	return items.flatMap((item) => [item, ...(item.items ? flattenNavItems(item.items) : [])])
}

export const canAccessNavItem = (user: IUser | null | undefined, navItem: INav): boolean => {
	if (!user) return false

	if (navItem.roles?.length && !navItem.roles.some((role) => hasRole(user.role, role, true))) {
		return false
	}

	if (navItem.permissions?.length && !hasAnyPermission(user, navItem.permissions)) {
		return false
	}

	return true
}

export const canAccessNavPath = (
	user: IUser | null | undefined,
	pathname: string,
	items: INav[] = navMain,
): boolean => {
	if (!user) return false

	const matchedItems = flattenNavItems(items).filter((item) => isPathMatch(pathname, item.url))

	if (!matchedItems.length) return true

	return matchedItems.every((item) => canAccessNavItem(user, item))
}
